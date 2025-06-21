// #include "Arduino.h"
#include "74hc595.h"
#include "fastio.h"


#define LSBFIRST 0
#define MSBFIRST 1

#define ENABLE_IO74HC595

#define IO74HC595_LATCH_PIN 47
#define IO74HC595_CLOCK_PIN 14
#define IO74HC595_DATA_PIN 21
//此变量最多支持4个串联（4x8=32）
// output value
DRAM_ATTR uint32_t io74hc595_port_data = 0;

uint8_t __always_inline io74hc595_state(uint8_t pin)
{
    return TEST(io74hc595_port_data, pin);
}

void __always_inline shiftOut32(uint8_t dataPin, uint8_t clockPin, uint8_t bitOrder, uint32_t val)
{
    uint8_t i;

    for (i = 0; i < 32; i++)
    {
        if (bitOrder == LSBFIRST)
            digitalWrite(dataPin, !!(val & (1 << i)));
        else
            digitalWrite(dataPin, !!(val & (1 << (31 - i))));

        digitalWrite(clockPin, HIGH);
        digitalWrite(clockPin, LOW);
    }
}

void __always_inline IRAM_ATTR shiftOut16(uint8_t dataPin, uint8_t clockPin, uint8_t bitOrder, uint32_t val)
{
    uint8_t i;

    for (i = 0; i < 16; i++)
    {
        if (bitOrder == LSBFIRST)
            digitalWrite(dataPin, !!(val & (1 << i)));
        else
            digitalWrite(dataPin, !!(val & (1 << (15 - i))));

        digitalWrite(clockPin, HIGH);
        digitalWrite(clockPin, LOW);
    }
}

// static portMUX_TYPE mutType = portMUX_INITIALIZER_UNLOCKED;

void __always_inline IRAM_ATTR io74hc595_write(uint8_t pin, uint8_t val)
{
    // portENTER_CRITICAL(&mutType);
    // SERIAL_ECHOPGM("io74hc595_write " );
    SET_BIT_TO(io74hc595_port_data, pin, val);
    digitalWrite(IO74HC595_LATCH_PIN, LOW);
    shiftOut16(IO74HC595_DATA_PIN, IO74HC595_CLOCK_PIN, MSBFIRST, io74hc595_port_data);
    digitalWrite(IO74HC595_LATCH_PIN, HIGH);

    // portEXIT_CRITICAL(&mutType);
}

int io74hc595_init()
{
    io74hc595_port_data = 0;
    OUT_WRITE(IO74HC595_LATCH_PIN, HIGH);
    OUT_WRITE(IO74HC595_CLOCK_PIN, LOW);
    OUT_WRITE(IO74HC595_DATA_PIN, LOW);

    digitalWrite(IO74HC595_LATCH_PIN, LOW);
    shiftOut16(IO74HC595_DATA_PIN, IO74HC595_CLOCK_PIN, MSBFIRST, io74hc595_port_data);
    digitalWrite(IO74HC595_LATCH_PIN, HIGH);

    return true;
}
