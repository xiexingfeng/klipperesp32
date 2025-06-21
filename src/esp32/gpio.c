// GPIO functions on simulator.
//
// Copyright (C) 2016  Kevin O'Connor <kevin@koconnor.net>
//
// This file may be distributed under the terms of the GNU GPLv3 license.

#include "board/gpio.h" // gpio_out_write
#include "fastio.h"
#include "board/irq.h" // irq_save
#include <stdio.h>
#include "soc/soc.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "driver/timer.h"
// #include "esp_clk_tree.h"
#include "esp_log.h"
#include "hal/gpio_hal.h"


// #define GPIO_IS_VALID_GPIO(gpio_num)        (((1ULL << (gpio_num)) & SOC_GPIO_VALID_GPIO_MASK) != 0)



extern void __always_inline IRAM_ATTR __pinMode(uint8_t pin, uint8_t mode)
{
#ifdef RGB_BUILTIN
    if (pin == RGB_BUILTIN){
        __pinMode(RGB_BUILTIN-SOC_GPIO_PIN_COUNT, mode);
        return;
    }
#endif

    if (!GPIO_IS_VALID_GPIO(pin)) {
        // log_e("Invalid pin selected");
        return;
    }
    
    gpio_hal_context_t gpiohal;
    gpiohal.dev = GPIO_LL_GET_HW(GPIO_PORT_0);

    gpio_config_t conf = {
        .pin_bit_mask = (1ULL<<pin),                 /*!< GPIO pin: set with bit mask, each bit maps to a GPIO */
        .mode = GPIO_MODE_DISABLE,                   /*!< GPIO mode: set input/output mode                     */
        .pull_up_en = GPIO_PULLUP_DISABLE,           /*!< GPIO pull-up                                         */
        .pull_down_en = GPIO_PULLDOWN_DISABLE,       /*!< GPIO pull-down                                       */
        .intr_type = gpiohal.dev->pin[pin].int_type  /*!< GPIO interrupt type - previously set                 */
    };
    if (mode < 0x20) {//io
        conf.mode = mode & (INPUT | OUTPUT);
        if (mode & OPEN_DRAIN) {
            conf.mode |= GPIO_MODE_DEF_OD;
        }
        if (mode & PULLUP) {
            conf.pull_up_en = GPIO_PULLUP_ENABLE;
        }
        if (mode & PULLDOWN) {
            conf.pull_down_en = GPIO_PULLDOWN_ENABLE;
        }
    }
    if(gpio_config(&conf) != ESP_OK)
    {
        // log_e("GPIO config failed");
        return;
    }
}
extern int __always_inline IRAM_ATTR __digitalRead(uint8_t pin)
{
	return gpio_get_level((gpio_num_t)pin);
}

extern void pinMode(uint8_t pin, uint8_t mode) __attribute__ ((weak, alias("__pinMode")));
extern int digitalRead(uint8_t pin) __attribute__ ((weak, alias("__digitalRead")));

struct gpio_out __always_inline IRAM_ATTR gpio_out_setup(uint8_t pin, uint8_t val)
{
    OUT_WRITE(pin, val);
    return (struct gpio_out){.pin = pin};
}
void __always_inline IRAM_ATTR gpio_out_reset(struct gpio_out g, uint8_t val)
{
    OUT_WRITE(g.pin, val);
}
void __always_inline IRAM_ATTR gpio_out_toggle_noirq(struct gpio_out g)
{
    TOGGLE(g.pin);
}
void __always_inline IRAM_ATTR gpio_out_toggle(struct gpio_out g)
{
    irqstatus_t flag = irq_save();
    gpio_out_toggle_noirq(g);
    irq_restore(flag);
}
void __always_inline IRAM_ATTR gpio_out_write(struct gpio_out g, uint8_t val)
{
    WRITE(g.pin, val);
}
struct gpio_in __always_inline IRAM_ATTR gpio_in_setup(uint8_t pin, int8_t pull_up)
{
    SET_INPUT(pin);
    _PULLUP(pin, pull_up);
    return (struct gpio_in){.pin = pin};
}
void __always_inline IRAM_ATTR gpio_in_reset(struct gpio_in g, int8_t pull_up)
{
    SET_INPUT(g.pin);
    _PULLUP(g.pin, pull_up);
}
uint8_t __always_inline IRAM_ATTR gpio_in_read(struct gpio_in g)
{
    return READ(g.pin);
}

