#ifndef __IO74HC595_H
#define __IO74HC595_H
#include <stdint.h>

#ifdef __cplusplus
extern "C"
{
#endif
    int io74hc595_init();

    uint8_t io74hc595_state(uint8_t pin);

    void io74hc595_write(uint8_t pin, uint8_t val);
#ifdef __cplusplus
}
#endif

#endif //__IO74HC595_H
