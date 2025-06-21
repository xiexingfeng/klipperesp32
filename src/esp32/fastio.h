/**
 * Marlin 3D Printer Firmware
 * Copyright (c) 2020 MarlinFirmware [https://github.com/MarlinFirmware/Marlin]
 *
 * Based on Sprinter and grbl.
 * Copyright (c) 2011 Camiel Gubbels / Erik van der Zalm
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */
#pragma once

// #include "Arduino.h"
#include "74hc595.h"
#include "driver/gpio.h"

/**
 * Utility functions
 */
#define bit(b) (1UL << (b))
#define _BV(b) (1UL << (b))

#define LOW               0x0
#define HIGH              0x1

//GPIO FUNCTIONS
#define INPUT             0x01
// Changed OUTPUT from 0x02 to behave the same as Arduino pinMode(pin,OUTPUT) 
// where you can read the state of pin even when it is set as OUTPUT
#define OUTPUT            0x03 
#define PULLUP            0x04
#define INPUT_PULLUP      0x05
#define PULLDOWN          0x08
#define INPUT_PULLDOWN    0x09
#define OPEN_DRAIN        0x10
#define OUTPUT_OPEN_DRAIN 0x12
#define ANALOG            0xC0

void pinMode(uint8_t pin, uint8_t mode);
int digitalRead(uint8_t pin);

#define digitalWrite(pin, val)  gpio_set_level((gpio_num_t)pin, val)

#define NOOP ((void) 0)
#define TEST(n,b) (!!((n)&_BV(b)))
#define SET_BIT_TO(N,B,TF) do{ if (TF) SBI(N,B); else CBI(N,B); }while(0)
#ifndef SBI
  #define SBI(A,B) (A |= _BV(B))
#endif
#ifndef CBI
  #define CBI(A,B) (A &= ~_BV(B))
#endif

// I2S expander pin mapping.
#define IS_I2S_EXPANDER_PIN(IO) TEST(IO, 7)
#define I2S_EXPANDER_PIN_INDEX(IO) (IO & 0x7F)

#define _pinMode(IO, v) (IS_I2S_EXPANDER_PIN(IO) ? NOOP : pinMode(IO, v))

// Set pin as input
#define _SET_INPUT(IO) _pinMode(IO, INPUT)

// Set pin as output
#define _SET_OUTPUT(IO) _pinMode(IO, OUTPUT)

// Set pin as input with pullup mode
#define _PULLUP(IO, v) _pinMode(IO, v ? INPUT_PULLUP : INPUT)

// Read a pin wrapper
#define READ(IO) (IS_I2S_EXPANDER_PIN(IO) ? io74hc595_state(I2S_EXPANDER_PIN_INDEX(IO)) : digitalRead(IO))
// Write to a pin wrapper
#define WRITE(IO, v) (IS_I2S_EXPANDER_PIN(IO) ? io74hc595_write(I2S_EXPANDER_PIN_INDEX(IO), v) : digitalWrite(IO, v))

// Set pin as input wrapper (0x80 | (v << 5) | (IO - 100))
#define SET_INPUT(IO) _SET_INPUT(IO)

// Set pin as input with pullup wrapper
#define SET_INPUT_PULLUP(IO) \
  do                         \
  {                          \
    _SET_INPUT(IO);          \
    _PULLUP(IO, HIGH);       \
  } while (0)

// Set pin as input with pulldown (substitution)
#define SET_INPUT_PULLDOWN SET_INPUT

// Set pin as output wrapper
#define SET_OUTPUT(IO) \
  do                   \
  {                    \
    _SET_OUTPUT(IO);   \
  } while (0)

// Set pin as PWM
#define SET_PWM SET_OUTPUT

// Set pin as output and init
#define OUT_WRITE(IO, V) \
  do                     \
  {                      \
    _SET_OUTPUT(IO);     \
    WRITE(IO, V);        \
  } while (0)

// digitalRead/Write wrappers
#define extDigitalRead(IO) digitalRead(IO)
#define extDigitalWrite(IO, V) digitalWrite(IO, V)

// PWM outputs
#define PWM_PIN(P) (P < 34 || P > 127) // NOTE Pins >= 34 are input only on ESP32, so they can't be used for output.

// Toggle pin value
#define TOGGLE(IO) WRITE(IO, !READ(IO))

