// Example code for interacting with serial_irq.c
//
// Copyright (C) 2018  Kevin O'Connor <kevin@koconnor.net>
//
// This file may be distributed under the terms of the GNU GPLv3 license.
#include "autoconf.h"
// #define TCP_SND_QUEUELEN                ((3000 * (TCP_SND_BUF) + (TCP_MSS - 1))/(TCP_MSS))
#include "board/serial_irq.h" // serial_get_tx_byte
#include "sched.h"            // DECL_INIT
// #include "driver/uart.h"
#include "soc/uart_struct.h"
#include "board/irq.h" // irq_disable

#include <esp_task_wdt.h>
#include <esp_wifi.h>

#include "esp_log.h"

// #include <Arduino.h>
#include "lwip/api.h"
#include "lwip/err.h"
#include "lwip/sys.h"
#include "lwip/netdb.h"
#include "esp_sleep.h"

#include "lwip/def.h"
#include "lwip/err.h"
#include "lwip/udp.h"
#include "netif/etharp.h"

// #define WIFI_SSID "simon 的iPhone"
// #define WIFI_SSID "simonxxf"
// #define WIFI_PASS "13929555657"
// #define WIFI_SSID "candy"
// #define WIFI_PASS "13927432032"
// #define WIFI_SSID "Revopoint-VPN"
// #define WIFI_PASS "Marketing888"

#define WIFI_SSID "REVO_RD_DEPARTMENT_VPN"
#define WIFI_PASS "internetvpn"

#define AP_SSID "esp32_klipper"
#define AP_PASS "12345678"
#define STA_CONNECT_TIMEOUT_SECONDS 30

#define TAG "TCP_SERVER"
// static xQueueHandle _async_queue;
#define LISTEN_PORT 5000
static DRAM_ATTR bool sta_connected = false;

// static struct netconn *conn;
static DRAM_ATTR ip_addr_t target_ip;
static DRAM_ATTR uint16_t target_port;

static DRAM_ATTR struct udp_pcb *pcb = NULL;

// static DRAM_ATTR TaskHandle_t sendTaskHandle = NULL;
static DRAM_ATTR char send_buffer[300];
static DRAM_ATTR uint16_t send_len = 0;

void udp_receive_task(void *pvParameters);

void disable_sleep()
{
    esp_sleep_enable_timer_wakeup(0);
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_PERIPH, ESP_PD_OPTION_OFF);
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_FAST_MEM, ESP_PD_OPTION_OFF);
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_SLOW_MEM, ESP_PD_OPTION_OFF);
    esp_sleep_pd_config(ESP_PD_DOMAIN_XTAL, ESP_PD_OPTION_OFF);
    esp_sleep_pd_config(ESP_PD_DOMAIN_MAX, ESP_PD_OPTION_OFF);
}

void disable_wifi_power_save()
{
    wifi_ps_type_t power_save_type;
    esp_wifi_get_ps(&power_save_type);
    if (power_save_type != WIFI_PS_NONE)
    {
        esp_wifi_set_ps(WIFI_PS_NONE);
    }
}

static void __always_inline IRAM_ATTR udp_send_data(const void *data, uint16_t size)
{
    struct pbuf *out = pbuf_alloc(PBUF_TRANSPORT, size, PBUF_RAM);
	if (out){
        memcpy(out->payload, data, size);
        udp_sendto(pcb, out, &target_ip, target_port);
        pbuf_free(out);
    }
    
}
// Statically allocate and initialize the spinlock
// static DRAM_ATTR portMUX_TYPE my_spinlock = portMUX_INITIALIZER_UNLOCKED;
void IRAM_ATTR sendTaskfn(void *parameter)
{
    for (;;)
    {
        if (0 != ulTaskNotifyTake(pdTRUE, portMAX_DELAY))
        {
            if (send_len > 0)
            {
                // log_i(" send: len: %d\n", send_len);
                // taskENTER_CRITICAL(&my_spinlock);
                // static DRAM_ATTR char buffer[300];
                // int len = send_len;
                // memcpy(buffer, send_buffer, len);
                irq_disable();
                udp_send_data(send_buffer, send_len);
                send_len = 0;
                irq_enable();

                // taskEXIT_CRITICAL(&my_spinlock);
                
            }
            // else{
            //     log_i("no send: len: %d----------------\n\n", send_len);
            // }
        }
        else
        {
        }

        vTaskDelay(1);
    }

    vTaskDelete(NULL);
}

void wifi_task()
{
    if (send_len > 0)
    {
        irq_disable();
        udp_send_data(send_buffer, send_len);
        send_len = 0;
        irq_enable();        
    }    
}



// portMUX_TYPE *my_spinlock =(portMUX_TYPE*) malloc(sizeof(portMUX_TYPE));
void IRAM_ATTR wifiSendData(uint8_t data, bool bEnd)
{
    if (likely(target_port != 0))
    {
        if (!bEnd)
        {
            if (likely(send_len < sizeof(send_buffer))){
                send_buffer[send_len++] = data;
                if(send_len>200)
                    send_len = 0;
                // if (data == 0x7E){
                //     BaseType_t xHigherPriorityTaskWoken = pdFALSE;
                //     vTaskNotifyGiveFromISR(sendTaskHandle, &xHigherPriorityTaskWoken);
                //     portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
                // }
            }
                
        }
    }
}

static void event_handler(void *arg, esp_event_base_t event_base, int32_t event_id, void *event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START)
    {
        esp_wifi_connect();
    }
    else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_CONNECTED)
    {
        ESP_LOGI("wifi", "Connected to the AP");
        sta_connected = true;
    }
    else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP)
    {
        ip_event_got_ip_t *event = (ip_event_got_ip_t *)event_data;
        esp_ip4_addr_t ip = event->ip_info.ip;
        ESP_LOGI("wifi", "Got an IP address: %d.%d.%d.%d", IP2STR(&ip));
    }
    else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED)
    {
        ESP_LOGI("wifi", "Disconnected from the AP, retrying...");
        sta_connected = false;
        esp_wifi_connect();
    }

    switch (event_id)
    {
    case SYSTEM_EVENT_AP_START:
        ESP_LOGI(TAG, "WiFi access point started");
        break;
    case SYSTEM_EVENT_AP_STACONNECTED:
        ESP_LOGI(TAG, "Station connected");
        break;
    case SYSTEM_EVENT_AP_STADISCONNECTED:
        ESP_LOGI(TAG, "Station disconnected");
        break;
    default:
        break;
    }
}

void wifi_init_sta()
{
    ESP_LOGI(TAG, "wifi_init_sta");
    esp_netif_init();
    esp_netif_create_default_wifi_sta(); // 在ESP32-S3上创建默认的WiFi STA接口

    esp_event_handler_instance_t instance_any_id;
    esp_event_handler_instance_t instance_got_ip;
    esp_event_handler_instance_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &event_handler, NULL, &instance_any_id);
    esp_event_handler_instance_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &event_handler, NULL, &instance_got_ip);

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    // // 禁用ampdu
    // cfg.ampdu_rx_enable = 0;
    // cfg.ampdu_tx_enable = 0;
    // cfg.amsdu_tx_enable = 0;    

    // // // 禁止省电
    // cfg.sta_disconnected_pm = false;
    // // 使用静态缓冲区？1为静态
    //  cfg.tx_buf_type = 1;
    // //静态缓冲区的个数，原来缺省为8
    //  cfg.static_tx_buf_num = 8;
    //  // //发送缓冲区个数，原料为16
    //  cfg.cache_tx_buf_num = 16;

    // cfg.static_rx_buf_num =8;


    cfg.wifi_task_core_id = 0;

    esp_wifi_init(&cfg);
    esp_wifi_set_mode(WIFI_MODE_STA);

    wifi_config_t wifi_config;
    memset(&wifi_config, 0, sizeof(wifi_config));
    strcpy((char *)wifi_config.sta.ssid, WIFI_SSID);
    strcpy((char *)wifi_config.sta.password, WIFI_PASS);

    esp_wifi_set_config(WIFI_IF_STA, &wifi_config);
    esp_wifi_start();

    // startSerialWifi();
}

void wifi_init_ap()
{
    // esp_wifi_stop();
    esp_netif_init();
    esp_netif_create_default_wifi_ap(); // 在ESP32-S3上创建默认的WiFi AP接口
    // wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    // ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    wifi_config_t wifi_config = {
        .ap = {
            .ssid = AP_SSID,
            .ssid_len = strlen(AP_SSID),
            .password = AP_PASS,
            .max_connection = 4,
            .authmode = WIFI_AUTH_WPA_WPA2_PSK,
        },
    };

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_AP));
    ESP_ERROR_CHECK(esp_wifi_set_config(ESP_IF_WIFI_AP, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());
    ESP_ERROR_CHECK(esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &event_handler, NULL));
    ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, IP_EVENT_AP_STAIPASSIGNED, &event_handler, NULL));
}


static void IRAM_ATTR udp_recv_proc(void *arg, struct udp_pcb *upcb, struct pbuf *p, const ip_addr_t *addr, u16_t port)
{
    target_ip = *addr;
    target_port = port;    
    struct pbuf *pbuf = p; // 获取一个 pbuf
    while (pbuf != NULL) {
        uint8_t *data_ptr = (uint8_t *)pbuf->payload;
        size_t data_length = pbuf->len;
        
        for (int i = 0; i < data_length; i++)
        {
            serial_rx_byte(data_ptr[i]);
        }
        
        pbuf = pbuf->next; // 移动到下一个 pbuf
    }
    pbuf_free(p);

}

void udp_server(void)
{
	err_t err;
	udp_init();

	pcb = udp_new();
	if (pcb == NULL)
		return ;
	err = udp_bind(pcb, NULL, LISTEN_PORT);
	if (err != ERR_OK)
	{
		return ;
	}
	udp_recv(pcb, udp_recv_proc, NULL);

    // _async_queue = xQueueCreate(128, sizeof(struct tagMessage *));

    // xTaskCreatePinnedToCore(
    //     sendTaskfn,         /* Task function. */
    //     "socket send Task", /* name of task. */
    //     4096,               /* Stack size of task */
    //     NULL,               /* parameter of the task */
    //     10,                 /* priority of the task */
    //     &sendTaskHandle,    /* Task handle to keep track of created task */
    //     0                   /* Core to run the task */
    // );

}

void WifiTaskfn(void *parameter)
{
    wifi_init_sta();
    // Wait for STA mode connection with timeout
    TickType_t sta_timeout = pdMS_TO_TICKS(STA_CONNECT_TIMEOUT_SECONDS * 1000);
    TickType_t start_time = xTaskGetTickCount();
    while (!sta_connected && (xTaskGetTickCount() - start_time) < sta_timeout)
    {
        vTaskDelay(pdMS_TO_TICKS(100));
    }

    // If STA connection not successful, create an AP hotspot
    if (!sta_connected)
    {
        ESP_LOGW(TAG, "STA connection timed out, creating AP hotspot...");
        // create_ap_hotspot();
        wifi_init_ap();
    }
    else
    {
        ESP_LOGW(TAG, "STA connection to wifi successed.");
    }

    udp_server();

    // while (1)
    // {
    //     esp_task_wdt_reset();
    //     // usleep(100);
    //     vTaskDelay(100);
    // }

    vTaskDelete(NULL);
}

void wifi_init()
{
    disable_sleep();
    disable_wifi_power_save();
    // enableLoopWDT();
    xTaskCreatePinnedToCore(
        WifiTaskfn,  /* Task function. */
        "Wifi Task", /* name of task. */
        4096,        /* Stack size of task */
        NULL,        /* parameter of the task */
        10,          /* priority of the task */
        NULL,        /* Task handle to keep track of created task */
        0            /* Core to run the task */
    );
}
