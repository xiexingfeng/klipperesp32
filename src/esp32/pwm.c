#include "command.h"
// #include "Arduino.h"
#include "board/gpio.h" // gpio_out_write
#include "fastio.h"
#include "esp32-hal-ledc.h"
#include "compiler.h"

long __always_inline IRAM_ATTR map(long x, long in_min, long in_max, long out_min, long out_max)
{
  const long run = in_max - in_min;
  if (run == 0)
  {
    // log_e("map(): Invalid input range, min == max");
    return -1; // AVR returns -1, SAM returns 0
  }
  const long rise = out_max - out_min;
  const long delta = x - in_min;
  return (delta * rise) / run + out_min;
}

//硬件

// ------------------------
// PWM
// ------------------------
typedef int16_t pin_t;

#define HAL_CAN_SET_PWM_FREQ // This HAL supports PWM Frequency adjustment
#define PWM_FREQUENCY 1000u  // Default PWM frequency when set_pwm_duty() is called without set_pwm_frequency()
#define PWM_RESOLUTION 10u   // Default PWM bit resolution
#define CHANNEL_MAX_NUM 15u  // max PWM channel # to allocate (7 to only use low speed, 15 to use low & high)
#define MAX_PWM_IOPIN 33u    // hardware pwm pins < 34

pin_t DRAM_ATTR chan_pin[CHANNEL_MAX_NUM + 1] = {0}; // PWM capable IOpins - not 0 or >33 on ESP32
DRAM_ATTR struct
{
  uint32_t freq; // ledcReadFreq doesn't work if a duty hasn't been set yet!
  uint16_t res;
} pwmInfo[(CHANNEL_MAX_NUM + 1) / 2];

#define WITHIN(N, L, H) ((N) >= (L) && (N) <= (H))

int8_t __always_inline IRAM_ATTR channel_for_pin(const uint8_t pin)
{
  for (int i = 0; i <= CHANNEL_MAX_NUM; i++)
    if (chan_pin[i] == pin)
      return i;
  return -1;
}

// get PWM channel for pin - if none then attach a new one
// return -1 if fail or invalid pin#, channel # (0-15) if success
int8_t __always_inline IRAM_ATTR get_pwm_channel(const pin_t pin, const uint32_t freq, const uint16_t res)
{
  if (!WITHIN(pin, 1, MAX_PWM_IOPIN))
    return -1; // Not a hardware PWM pin!
  int8_t cid = channel_for_pin(pin);
  if (cid >= 0)
    return cid;

  // Find an empty adjacent channel (same timer & freq/res)
  for (int i = 0; i <= CHANNEL_MAX_NUM; i++)
  {
    if (chan_pin[i] == 0)
    {
      if (chan_pin[i ^ 0x1] != 0)
      {
        if (pwmInfo[i / 2].freq == freq && pwmInfo[i / 2].res == res)
        {
          chan_pin[i] = pin; // Allocate PWM to this channel
          ledcAttachPin(pin, i);
          return i;
        }
      }
      else if (cid == -1) // Pair of empty channels?
        cid = i & 0xFE;   // Save lower channel number
    }
  }
  // not attached, is an empty timer slot avail?
  if (cid >= 0)
  {
    chan_pin[cid] = pin;
    pwmInfo[cid / 2].freq = freq;
    pwmInfo[cid / 2].res = res;
    ledcSetup(cid, freq, res);
    ledcAttachPin(pin, cid);
  }
  return cid; // -1 if no channel avail
}

void __always_inline IRAM_ATTR set_pwm_duty(const pin_t pin, const uint16_t v, const uint16_t v_size /*=_BV(PWM_RESOLUTION)-1*/, const bool invert /*=false*/)
{
  const int8_t cid = get_pwm_channel(pin, PWM_FREQUENCY, PWM_RESOLUTION);
  if (cid >= 0)
  {
    uint32_t duty = map(invert ? v_size - v : v, 0, v_size, 0, _BV(PWM_RESOLUTION) - 1);
    ledcWrite(cid, duty);
  }
}

int8_t __always_inline IRAM_ATTR set_pwm_frequency(const pin_t pin, const uint32_t f_desired)
{
  const int8_t cid = channel_for_pin(pin);
  if (cid >= 0)
  {
    if (f_desired == ledcReadFreq(cid))
      return cid; // no freq change
    ledcDetachPin(chan_pin[cid]);
    chan_pin[cid] = 0; // remove old freq channel
  }
  return get_pwm_channel(pin, f_desired, PWM_RESOLUTION); // try for new one
}

struct gpio_pwm __always_inline IRAM_ATTR gpio_pwm_setup(uint8_t pin, uint32_t cycle_time, uint8_t val)
{
  // if(pin >= 30)
  //     shutdown("invalid gpio pin");
  set_pwm_frequency(pin, cycle_time);
  set_pwm_duty(pin, val, 255, false);
  return (struct gpio_pwm){.pin = pin};
}
//软件的
// val 0~255
void __always_inline IRAM_ATTR gpio_pwm_write(struct gpio_pwm g, uint8_t val)
{
  set_pwm_duty(g.pin, val, 255, false);
}
