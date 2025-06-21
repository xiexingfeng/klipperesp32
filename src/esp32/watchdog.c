// Initialization of AVR watchdog timer.
//
// Copyright (C) 2016  Kevin O'Connor <kevin@koconnor.net>
//
// This file may be distributed under the terms of the GNU GPLv3 license.

// #include <avr/interrupt.h> // WDT_vect
// #include <avr/wdt.h> // wdt_enable
#include "command.h" // shutdown
#include <esp_task_wdt.h>
#include "sched.h" // DECL_TASK
#include "board/irq.h"
#include "esp_log.h"

void IRAM_ATTR watchdog_reset(void)
{
    // ESP_LOGI("DOW", "dddddd");
    esp_task_wdt_reset();
    // vTaskDelay(1);
}
DECL_TASK(watchdog_reset);

void watchdog_init(void)
{
    // 0.5s timeout, interrupt and system reset
    esp_task_wdt_init(10, true);    //1s
    esp_task_wdt_add(NULL);
}
DECL_INIT(watchdog_init);


void command_reset(uint32_t *args)
{
    irq_disable();
    esp_restart();
}
DECL_COMMAND_FLAGS(command_reset, HF_IN_SHUTDOWN, "reset");
