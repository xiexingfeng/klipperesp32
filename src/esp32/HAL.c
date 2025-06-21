#include "HAL.h"
#include "board/gpio.h" // gpio_out_write
#include "fastio.h"
#include "74hc595.h"

void HAL_init()
{
    io74hc595_init();
}
