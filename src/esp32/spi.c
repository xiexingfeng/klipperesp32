// GPIO functions on simulator.
//
// Copyright (C) 2016  Kevin O'Connor <kevin@koconnor.net>
//
// This file may be distributed under the terms of the GNU GPLv3 license.

#include "board/gpio.h" // gpio_out_write
#include "command.h"
#include "fastio.h"

DECL_ENUMERATION("spi_bus", "spi0a", 0);
DECL_CONSTANT_STR("BUS_PINS_spi0a", "11,12,13,10");
DECL_ENUMERATION("spi_bus", "spi0b", 1);
DECL_CONSTANT_STR("BUS_PINS_spi0b", "11,12,13,133");
DECL_ENUMERATION("spi_bus", "spi0c", 2);
DECL_CONSTANT_STR("BUS_PINS_spi0c", "11,12,13,134");

struct spi_config
spi_setup(uint32_t bus, uint8_t mode, uint32_t rate)
{
    return (struct spi_config){};
}
void spi_prepare(struct spi_config config)
{
}
void spi_transfer(struct spi_config config, uint8_t receive_data, uint8_t len, uint8_t *data)
{
}
