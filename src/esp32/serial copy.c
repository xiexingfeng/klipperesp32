// Example code for interacting with serial_irq.c
//
// Copyright (C) 2018  Kevin O'Connor <kevin@koconnor.net>
//
// This file may be distributed under the terms of the GNU GPLv3 license.
#include "autoconf.h"
#include "board/serial_irq.h" // serial_get_tx_byte
#include "sched.h"            // DECL_INIT
#include "driver/uart.h"
#include "soc/uart_struct.h"
#include "board/irq.h" // irq_disable

#include <esp_task_wdt.h>
#include "serialwifi.h"

#define UART_NUM UART_NUM_0
#define TXD_PIN (43)
#define RXD_PIN (44)
static DRAM_ATTR const int RX_BUF_SIZE = 1024;

static void IRAM_ATTR uart_rev_isr(void *arg)
{
    // irq_disable();
    volatile uart_dev_t *uart = (uart_dev_t *)arg;

    uart->int_clr.frm_err_int_clr = 1;
    if (uart->int_st.rxfifo_full_int_st)
    { // 接收缓冲区满
        uart->int_clr.rxfifo_full_int_clr = 1;
    }
    if (uart->int_st.rxfifo_tout_int_st)
    { // 检查是否发生超时中断（接收）
        // 清中断
        uart->int_clr.rxfifo_tout_int_clr = 1;
    }
    // 读出收到的数据
    while (uart->status.rxfifo_cnt)
    {
        serial_rx_byte(uart->fifo.rxfifo_rd_byte);
    }

    if (uart->int_st.txfifo_empty_int_st)
    {
        // uart->int_clr.txfifo_empty_int_clr = 1;
        // uart->int_ena.txfifo_empty_int_ena = 0;
        //             for (;;)
        // {
        static DRAM_ATTR uint8_t  data = 0x30;
        int ret = serial_get_tx_byte(&data);

        static bool bEnd = false;

        if (ret == 0)
        {
            // 第次发送一个数据
            uart->conf1.txfifo_empty_thrhd = 1;
            // uart->int_ena.txfifo_empty_int_ena = 0;
            uart->fifo.rxfifo_rd_byte = data;
            bEnd = false;
        }
        else
        {
            uart->int_clr.txfifo_empty_int_clr = 1;
            uart->int_ena.txfifo_empty_int_ena = 0;
            bEnd = true;
            // 要发送的数据发送完成，要清除中断，否则还会不断进入中断
        }
        // wifiSendData(data, bEnd);
    }

    // irq_enable();
}

void serial_init(void)
{
    const uart_config_t uart_config = {
        .baud_rate = CONFIG_SERIAL_BAUD,
        .data_bits = UART_DATA_8_BITS,
        .parity = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        // .flow_ctrl = UART_HW_FLOWCTRL_DISABLE,//UART_HW_FLOWCTRL_CTS_RTS, // UART_HW_FLOWCTRL_DISABLE,
        // .source_clk = UART_SCLK_APB,
    };
    ESP_ERROR_CHECK(uart_param_config(UART_NUM, &uart_config));
    ESP_ERROR_CHECK(uart_set_pin(UART_NUM, TXD_PIN, RXD_PIN, UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE));

    // We won't use a buffer for sending data.
    ESP_ERROR_CHECK(uart_driver_install(UART_NUM, RX_BUF_SIZE * 2, 0, 0, NULL, 0));

    /* Unregister the default ISR setup by the function call above */
    ESP_ERROR_CHECK(uart_isr_free(UART_NUM));
    uart_isr_handle_t handle = NULL;
    ESP_ERROR_CHECK(uart_isr_register(UART_NUM, uart_rev_isr, &UART0, ESP_INTR_FLAG_LOWMED | ESP_INTR_FLAG_IRAM, &handle));
    /* Set the TX FIFO empty threshold to the size of the message we are sending,
     * make sure it is never 0 in any case */
    // ESP_ERROR_CHECK(uart_enable_tx_intr(UART_NUM, true, MAX(sizeof(msg), 1)));

    ESP_ERROR_CHECK(uart_enable_rx_intr(UART_NUM));
    ESP_ERROR_CHECK(uart_set_rx_timeout(UART_NUM, 20));
    ESP_ERROR_CHECK(uart_enable_tx_intr(UART_NUM, true, 1));
}
DECL_INIT(serial_init);

// 永远不会调用这个
void *
console_receive_buffer(void)
{
    return NULL;
}

void IRAM_ATTR serial_enable_tx_irq(void)
{
    // 设置中断状态，会进入中断函数执行
    UART0.int_ena.txfifo_empty_int_ena = 1;
}
