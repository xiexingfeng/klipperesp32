// #include <Arduino.h>
#include "sched.h"    // sched_main
#include "autoconf.h" // CONFIG_SERIAL_BAUD
#include "command.h"  // DECL_CONSTANT_STR
#include "HAL.h"
// #include "wifimanager.h"

#include "serialwifi.h"
#include "nvs_flash.h"

// Export MCU type
DECL_CONSTANT_STR("MCU", CONFIG_MCU);

#include "esp_event.h"
#include "esp_log.h"
// #include "esp_wifi.h"
// #include "esp_netif.h"
// #include "nvs_flash.h"

#include <esp_task_wdt.h>
#include "esp32/clk.h"
#include "soc/rtc.h"

// #define WIFI_SSID "simon 的iPhone"
// #define WIFI_PASS "13929555657"
// #define WIFI_SSID "candy"
// #define WIFI_PASS "13927432032"
// #define WIFI_SSID "Revopoint-VPN"
// #define WIFI_PASS "Marketing888"

// esp_event_loop_handle_t event_loop;

// static void event_handler(void* arg, esp_event_base_t event_base, int32_t event_id, void* event_data) {
//     if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
//         esp_wifi_connect();
//     } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_CONNECTED) {
//         ESP_LOGI("wifi", "Connected to the AP");
//     } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
//         ip_event_got_ip_t* event = (ip_event_got_ip_t*)event_data;
//         esp_ip4_addr_t ip = event->ip_info.ip;
//         ESP_LOGI("wifi", "Got an IP address: %d.%d.%d.%d", IP2STR(&ip));

//     } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
//         ESP_LOGI("wifi", "Disconnected from the AP, retrying...");
//         esp_wifi_connect();
//     }
// }

// void wifi_init() {
//     esp_netif_init();
//     esp_netif_create_default_wifi_sta(); // 在ESP32-S3上创建默认的WiFi STA接口

//     esp_event_handler_instance_t instance_any_id;
//     esp_event_handler_instance_t instance_got_ip;
//     esp_event_handler_instance_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &event_handler, NULL, &instance_any_id);
//     esp_event_handler_instance_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &event_handler, NULL, &instance_got_ip);

//     wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
//     //禁用ampdu
//     cfg.ampdu_tx_enable = cfg.amsdu_tx_enable = 0;
//     //禁止省电
//     cfg.sta_disconnected_pm = false;
//     //使用静态缓冲区？1为静态
//     // cfg.tx_buf_type = 1;
//     // //静态缓冲区的个数，原来缺省为8
//     // cfg.static_tx_buf_num = 36;
//     // cfg.dynamic_tx_buf_num = 64;
//     // // //发送缓冲区个数，原料为16
//     // cfg.cache_tx_buf_num = 32;

//     // cfg.ampdu_rx_enable = 0;
//     // cfg.static_rx_buf_num =16;
//     // cfg.dynamic_rx_buf_num = 64;

//     cfg.wifi_task_core_id = 0;

//     esp_wifi_init(&cfg);
//     esp_wifi_set_mode(WIFI_MODE_STA);

//     wifi_config_t wifi_config;
//     memset(&wifi_config, 0, sizeof(wifi_config));
//     strcpy((char*)wifi_config.sta.ssid, WIFI_SSID);
//     strcpy((char*)wifi_config.sta.password, WIFI_PASS);

//     esp_wifi_set_config(WIFI_IF_STA, &wifi_config);
//     esp_wifi_start();
// }

// void app_main() {
//     // 初始化ESP32-S3
//     esp_err_t ret = esp_event_loop_create_default();
//     if (ret != ESP_OK) {
//         // 错误处理
//         return;
//     }

//     // 初始化Wi-Fi
//     wifi_init();

//     startSerialWifi();
// }

// void WifiTaskfn1( void * parameter )
// {
//     app_main();
//     while (1)
//     {
//         esp_task_wdt_reset();
//         // usleep(100);
//         vTaskDelay(100);
//     }

//     vTaskDelete( NULL );
// }

// void setup()
// {
//     // Initialize NVS
//     esp_err_t ret = nvs_flash_init();
//     if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND)
//     {
//         ESP_ERROR_CHECK(nvs_flash_erase());
//         ret = nvs_flash_init();
//     }
//     ESP_ERROR_CHECK(ret);

//     // 初始化ESP32-S3
//     ret = esp_event_loop_create_default();
//     if (ret != ESP_OK)
//     {
//         // 错误处理
//         return;
//     }
//     // put your setup code here, to run once:
//     // Serial.begin(115200);
//     // Serial.begin(250000);
//     // if (sizeof(size_t) > sizeof(uint32_t))
//     //   Serial.println("System start...");
//     // Serial.begin(115200);
//     HAL_init();
//     // WiFiManager::begin();

//     // // usleep(10000000);
//     // sched_main();

//     //   app_main();
//     // enableLoopWDT();
//     //     xTaskCreatePinnedToCore(
//     //         WifiTaskfn1, /* Task function. */
//     //         "Wifi Task", /* name of task. */
//     //         8192, /* Stack size of task */
//     //         NULL, /* parameter of the task */
//     //         10, /* priority of the task */
//     //         NULL, /* Task handle to keep track of created task */
//     //         1    /* Core to run the task */
//     //     );
// }

// void loop()
// {
//     // put your main code here, to run repeatedly:
//     usleep(1);
//     sched_main();
// }


void sched_mainTaskfn( void * parameter )
{
    HAL_init();
    sched_main();

    vTaskDelete( NULL );
}

void app_main(void)
{
//     // Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND)
    {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

//     // 初始化ESP32-S3
    ret = esp_event_loop_create_default();
    if (ret != ESP_OK)
    {
        // 错误处理
        return;
    }    
    esp_task_wdt_reset();
    ESP_LOGI("TASK:", "system......");
    // int cur_freq_mhz = esp_clk_cpu_freq() / 1000000;
    // int xtal_freq = (int) rtc_clk_xtal_freq_get();

    // ESP_LOGI("TASK:", "%dmhz, xtal:%d", cur_freq_mhz, xtal_freq);

        xTaskCreatePinnedToCore(
            sched_mainTaskfn, /* Task function. */
            "sched main Task", /* name of task. */
            8192, /* Stack size of task */
            NULL, /* parameter of the task */
            configMAX_PRIORITIES - 1, /* priority of the task */
            NULL, /* Task handle to keep track of created task */
            1    /* Core to run the task */
        );


    // sched_main();
    while(1){
        esp_task_wdt_reset();
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}