// Copyright 2015-2016 Espressif Systems (Shanghai) PTE LTD
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #include "esp32-hal.h"
#include "esp32-hal-ledc.h"
#include "soc/soc_caps.h"
#include "driver/ledc.h"

#ifdef SOC_LEDC_SUPPORT_HS_MODE
#define LEDC_CHANNELS           (SOC_LEDC_CHANNEL_NUM<<1)
#else
#define LEDC_CHANNELS           (SOC_LEDC_CHANNEL_NUM)
#endif

//Use XTAL clock if possible to avoid timer frequency error when setting APB clock < 80 Mhz
//Need to be fixed in ESP-IDF
#ifdef SOC_LEDC_SUPPORT_XTAL_CLOCK
#define LEDC_DEFAULT_CLK        LEDC_USE_XTAL_CLK
#else
#define LEDC_DEFAULT_CLK        LEDC_AUTO_CLK
#endif

#define LEDC_MAX_BIT_WIDTH      SOC_LEDC_TIMER_BIT_WIDE_NUM

/*
 * LEDC Chan to Group/Channel/Timer Mapping
** ledc: 0  => Group: 0, Channel: 0, Timer: 0
** ledc: 1  => Group: 0, Channel: 1, Timer: 0
** ledc: 2  => Group: 0, Channel: 2, Timer: 1
** ledc: 3  => Group: 0, Channel: 3, Timer: 1
** ledc: 4  => Group: 0, Channel: 4, Timer: 2
** ledc: 5  => Group: 0, Channel: 5, Timer: 2
** ledc: 6  => Group: 0, Channel: 6, Timer: 3
** ledc: 7  => Group: 0, Channel: 7, Timer: 3
** ledc: 8  => Group: 1, Channel: 0, Timer: 0
** ledc: 9  => Group: 1, Channel: 1, Timer: 0
** ledc: 10 => Group: 1, Channel: 2, Timer: 1
** ledc: 11 => Group: 1, Channel: 3, Timer: 1
** ledc: 12 => Group: 1, Channel: 4, Timer: 2
** ledc: 13 => Group: 1, Channel: 5, Timer: 2
** ledc: 14 => Group: 1, Channel: 6, Timer: 3
** ledc: 15 => Group: 1, Channel: 7, Timer: 3
*/

DRAM_ATTR uint8_t channels_resolution[LEDC_CHANNELS] = {0};

uint32_t __always_inline ledcSetup(uint8_t chan, uint32_t freq, uint8_t bit_num)
{
    if(chan >= LEDC_CHANNELS || bit_num > LEDC_MAX_BIT_WIDTH){
        // log_e("No more LEDC channels available! (maximum %u) or bit width too big (maximum %u)", LEDC_CHANNELS, LEDC_MAX_BIT_WIDTH);
        return 0;
    }

    uint8_t group=(chan/8), timer=((chan/2)%4);

    ledc_timer_config_t ledc_timer = {
        .speed_mode       = group,
        .timer_num        = timer,
        .duty_resolution  = bit_num,
        .freq_hz          = freq,
        .clk_cfg          = LEDC_DEFAULT_CLK
    };
    if(ledc_timer_config(&ledc_timer) != ESP_OK)
    {
        // log_e("ledc setup failed!");
        return 0;
    }
    channels_resolution[chan] = bit_num;
    return ledc_get_freq(group,timer);
}

void __always_inline ledcWrite(uint8_t chan, uint32_t duty)
{
    if(chan >= LEDC_CHANNELS){
        return;
    }
    uint8_t group=(chan/8), channel=(chan%8);

    //Fixing if all bits in resolution is set = LEDC FULL ON
    uint32_t max_duty = (1 << channels_resolution[chan]) - 1;

    if((duty == max_duty) && (max_duty != 1)){
        duty = max_duty + 1;
    }

    ledc_set_duty(group, channel, duty);
    ledc_update_duty(group, channel);
}

uint32_t __always_inline ledcRead(uint8_t chan)
{
    if(chan >= LEDC_CHANNELS){
        return 0;
    }
    uint8_t group=(chan/8), channel=(chan%8);
    return ledc_get_duty(group,channel);
}

uint32_t __always_inline ledcReadFreq(uint8_t chan)
{
    if(!ledcRead(chan)){
        return 0;
    }
    uint8_t group=(chan/8), timer=((chan/2)%4);
    return ledc_get_freq(group,timer);
}

uint32_t __always_inline ledcWriteTone(uint8_t chan, uint32_t freq)
{
    if(chan >= LEDC_CHANNELS){
        return 0;
    }
    if(!freq){
        ledcWrite(chan, 0);
        return 0;
    }

    uint8_t group=(chan/8), timer=((chan/2)%4);

    ledc_timer_config_t ledc_timer = {
        .speed_mode       = group,
        .timer_num        = timer,
        .duty_resolution  = 10,
        .freq_hz          = freq, 
        .clk_cfg          = LEDC_DEFAULT_CLK
    };

    if(ledc_timer_config(&ledc_timer) != ESP_OK)
    {
        // log_e("ledcSetup failed!");
        return 0;
    }
    channels_resolution[chan] = 10;

    uint32_t res_freq = ledc_get_freq(group,timer);
    ledcWrite(chan, 0x1FF);
    return res_freq;
}

uint32_t __always_inline ledcWriteNote(uint8_t chan, note_t note, uint8_t octave){
    const uint16_t noteFrequencyBase[12] = {
    //   C        C#       D        Eb       E        F       F#        G       G#        A       Bb        B
        4186,    4435,    4699,    4978,    5274,    5588,    5920,    6272,    6645,    7040,    7459,    7902
    };

    if(octave > 8 || note >= NOTE_MAX){
        return 0;
    }
    uint32_t noteFreq =  (uint32_t)noteFrequencyBase[note] / (uint32_t)(1 << (8-octave));
    return ledcWriteTone(chan, noteFreq);
}

void __always_inline ledcAttachPin(uint8_t pin, uint8_t chan)
{
    if(chan >= LEDC_CHANNELS){
        return;
    }
    uint8_t group=(chan/8), channel=(chan%8), timer=((chan/2)%4);
    uint32_t duty = ledc_get_duty(group,channel);

    ledc_channel_config_t ledc_channel = {
        .speed_mode     = group,
        .channel        = channel,
        .timer_sel      = timer,
        .intr_type      = LEDC_INTR_DISABLE,
        .gpio_num       = pin,
        .duty           = duty,
        .hpoint         = 0
    };
    ledc_channel_config(&ledc_channel);
}


void __always_inline ledcDetachPin(uint8_t pin)
{
    gpio_matrix_out(pin, 0x100, false, false);
    // pinMatrixOutDetach(pin, false, false);
}

uint32_t __always_inline ledcChangeFrequency(uint8_t chan, uint32_t freq, uint8_t bit_num)
{
    if(chan >= LEDC_CHANNELS || bit_num > LEDC_MAX_BIT_WIDTH){
        // log_e("LEDC channel not available! (maximum %u) or bit width too big (maximum %u)", LEDC_CHANNELS, LEDC_MAX_BIT_WIDTH);
        return 0;
    }
    uint8_t group=(chan/8), timer=((chan/2)%4);

    ledc_timer_config_t ledc_timer = {
        .speed_mode       = group,
        .timer_num        = timer,
        .duty_resolution  = bit_num,
        .freq_hz          = freq, 
        .clk_cfg          = LEDC_DEFAULT_CLK
    };

    if(ledc_timer_config(&ledc_timer) != ESP_OK)
    {
        // log_e("ledcChangeFrequency failed!");
        return 0;
    }
    channels_resolution[chan] = bit_num;
    return ledc_get_freq(group,timer);
}


static int8_t pin_to_channel[SOC_GPIO_PIN_COUNT] = { 0 };
static int cnt_channel = LEDC_CHANNELS;
static uint8_t analog_resolution = 8;
static int analog_frequency = 1000;

static int8_t __always_inline analogGetChannel(uint8_t pin) {
    return pin_to_channel[pin];
}

static void __always_inline analogWrite(uint8_t pin, int value) {
    // Use ledc hardware for internal pins
    if (pin < SOC_GPIO_PIN_COUNT) {
        int8_t channel = -1;
        if (pin_to_channel[pin] == 0) {
            if (!cnt_channel) {
                // log_e("No more analogWrite channels available! You can have maximum %u", LEDC_CHANNELS);
                return;
            }
            cnt_channel--;
            channel = cnt_channel;
        } else {
            channel = analogGetChannel(pin);
        }
        // log_v("GPIO %d - Using Channel %d, Value = %d", pin, channel, value);
        if(ledcSetup(channel, analog_frequency, analog_resolution) == 0){
            // log_e("analogWrite setup failed (freq = %u, resolution = %u). Try setting different resolution or frequency");
            return;
        }
        ledcAttachPin(pin, channel);
        pin_to_channel[pin] = channel;
        ledcWrite(channel, value);
    }
}


static void __always_inline analogWriteFrequency(uint32_t freq) {
    if (cnt_channel != LEDC_CHANNELS) {
        for (int channel = LEDC_CHANNELS - 1; channel >= cnt_channel; channel--) {
            if (ledcChangeFrequency(channel, freq, analog_resolution) == 0){
                // log_e("analogWrite frequency cant be set due to selected resolution! Try to adjust resolution first");
                return;
            }
        }
    }
    analog_frequency = freq;
}

static void __always_inline analogWriteResolution(uint8_t bits) {
    if(bits > LEDC_MAX_BIT_WIDTH) {
        // log_w("analogWrite resolution width too big! Setting to maximum %u bits)", LEDC_MAX_BIT_WIDTH);
        bits = LEDC_MAX_BIT_WIDTH;
    }
    if (cnt_channel != LEDC_CHANNELS) {
        for (int channel = LEDC_CHANNELS - 1; channel >= cnt_channel; channel--) {
            if (ledcChangeFrequency(channel, analog_frequency, bits) == 0){
                // log_e("analogWrite resolution cant be set due to selected frequency! Try to adjust frequency first");
                return;
            }
        }
    }
    analog_resolution = bits;
}
