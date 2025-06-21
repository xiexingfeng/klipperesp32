// I2C functions on AVR
//
// Copyright (C) 2018  Kevin O'Connor <kevin@koconnor.net>
//
// This file may be distributed under the terms of the GNU GPLv3 license.

#include "autoconf.h" // CONFIG_CLOCK_FREQ
#include "board/misc.h" // timer_is_before
#include "command.h" // shutdown
#include "board/gpio.h" // i2c_setup
// #include "internal.h" // GPIO
#include "sched.h" // sched_shutdown

DECL_ENUMERATION("i2c_bus", "twi", 0);


struct i2c_config
i2c_setup(uint32_t bus, uint32_t rate, uint8_t addr)
{
    if (bus)
        shutdown("Unsupported i2c bus");

    return (struct i2c_config){ .addr=addr<<1 };
}

void
i2c_write(struct i2c_config config, uint8_t write_len, uint8_t *write)
{

}

void
i2c_read(struct i2c_config config, uint8_t reg_len, uint8_t *reg
         , uint8_t read_len, uint8_t *read)
{

}
