// Analog to Digital Converter support
//
// Copyright (C) 2016-2018  Kevin O'Connor <kevin@koconnor.net>
//
// This file may be distributed under the terms of the GNU GPLv3 license.

#include "autoconf.h"   // CONFIG_MACH_atmega644p
#include "command.h"    // shutdown
#include "board/gpio.h" // gpio_out_write
#include "fastio.h"
#include <driver/adc.h>
#include <esp_adc_cal.h>
#include <soc/adc_channel.h>
#include "board/misc.h" // timer_from_us

DECL_CONSTANT("ADC_MAX", 4095);

#define V_REF 1100

DRAM_ATTR esp_adc_cal_characteristics_t characteristics[ADC_ATTEN_MAX];
DRAM_ATTR adc_atten_t attenuations[ADC1_CHANNEL_MAX] = {};
DRAM_ATTR uint32_t thresholds[ADC_ATTEN_MAX];

// ------------------------
// ADC
// ------------------------

#define ADC1_CHANNEL(pin) ADC1_GPIO##pin##_CHANNEL

adc1_channel_t get_channel(int pin)
{
    switch (pin)
    {
#if CONFIG_IDF_TARGET_ESP32S3
    case 1:
        return ADC1_CHANNEL(1);
    case 2:
        return ADC1_CHANNEL(2);
    case 3:
        return ADC1_CHANNEL(3);
    case 4:
        return ADC1_CHANNEL(4);
    case 5:
        return ADC1_CHANNEL(5);
    case 6:
        return ADC1_CHANNEL(6);
#else
    case 39:
        return ADC1_CHANNEL(39);
    case 36:
        return ADC1_CHANNEL(36);
    case 35:
        return ADC1_CHANNEL(35);
    case 34:
        return ADC1_CHANNEL(34);
    case 33:
        return ADC1_CHANNEL(33);
    case 32:
        return ADC1_CHANNEL(32);
#endif
    }
    return ADC1_CHANNEL_MAX;
}

void adc_init()
{
    static bool init = false;
    if (init)
        return;
    init = true;
    adc1_config_width(ADC_WIDTH_12Bit);
    // Calculate ADC characteristics (i.e., gain and offset factors for each attenuation level)
    for (int i = 0; i < ADC_ATTEN_MAX; i++)
    {
        esp_adc_cal_characterize(ADC_UNIT_1, (adc_atten_t)i, ADC_WIDTH_BIT_12, V_REF, &characteristics[i]);

        // Change attenuation 100mV below the calibrated threshold
        thresholds[i] = esp_adc_cal_raw_to_voltage(4095, &characteristics[i]);
    }
}

void adc1_set_attenuation(adc1_channel_t chan, adc_atten_t atten)
{
    if (attenuations[chan] != atten)
    {
        adc1_config_channel_atten(chan, atten);
        attenuations[chan] = atten;
    }
}

#ifndef ADC_REFERENCE_VOLTAGE
#define ADC_REFERENCE_VOLTAGE 3.3
#endif

struct gpio_adc gpio_adc_setup(uint8_t pin)
{
    adc_init();
    adc1_set_attenuation(get_channel(pin), ADC_ATTEN_11db);
    return (struct gpio_adc){.pin = pin,.result=0};
}
uint16_t adc_result1 =0;
uint32_t gpio_adc_sample(struct gpio_adc g)
{
    const adc1_channel_t chan = get_channel(g.pin);
    uint32_t mv;
    if (ESP_OK != esp_adc_cal_get_voltage((adc_channel_t)chan, &characteristics[attenuations[chan]], &mv))
    {
        return timer_from_us(5);
    }
    // Change the attenuation level based on the new reading
    adc_atten_t atten = ADC_ATTEN_MAX;
    if (mv < thresholds[ADC_ATTEN_DB_0] - 100)
        atten = ADC_ATTEN_DB_0;
    else if (mv > thresholds[ADC_ATTEN_DB_0] - 50 && mv < thresholds[ADC_ATTEN_DB_2_5] - 100)
        atten = ADC_ATTEN_DB_2_5;
    else if (mv > thresholds[ADC_ATTEN_DB_2_5] - 50 && mv < thresholds[ADC_ATTEN_DB_6] - 100)
        atten = ADC_ATTEN_DB_6;
    else if (mv > thresholds[ADC_ATTEN_DB_6] - 50)
        atten = ADC_ATTEN_DB_11;
    if (atten != ADC_ATTEN_MAX)
        adc1_set_attenuation(chan, atten);    
    adc_result1 = mv * 4095.00 / ADC_REFERENCE_VOLTAGE / 1000.00;   
    g.result =  adc_result1;
    return 0;
    return timer_from_us(5);
}
uint16_t gpio_adc_read(struct gpio_adc g)
{
    return adc_result1;
    return g.result;
    const adc1_channel_t chan = get_channel(g.pin);
    uint32_t mv;
    if (ESP_OK != esp_adc_cal_get_voltage((adc_channel_t)chan, &characteristics[attenuations[chan]], &mv))
    {
        return 4096 / 2;
    }
    // Change the attenuation level based on the new reading
    adc_atten_t atten = ADC_ATTEN_MAX;
    if (mv < thresholds[ADC_ATTEN_DB_0] - 100)
        atten = ADC_ATTEN_DB_0;
    else if (mv > thresholds[ADC_ATTEN_DB_0] - 50 && mv < thresholds[ADC_ATTEN_DB_2_5] - 100)
        atten = ADC_ATTEN_DB_2_5;
    else if (mv > thresholds[ADC_ATTEN_DB_2_5] - 50 && mv < thresholds[ADC_ATTEN_DB_6] - 100)
        atten = ADC_ATTEN_DB_6;
    else if (mv > thresholds[ADC_ATTEN_DB_6] - 50)
        atten = ADC_ATTEN_DB_11;
    if (atten != ADC_ATTEN_MAX)
        adc1_set_attenuation(chan, atten);

    uint16_t adc_result = mv * 4095.00 / ADC_REFERENCE_VOLTAGE / 1000.00;
    return adc_result;
}
void gpio_adc_cancel_sample(struct gpio_adc g)
{
}
