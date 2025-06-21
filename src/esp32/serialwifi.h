#pragma once
#include <stdbool.h>

void wifi_init();
// call by isr
void wifiSendData(uint8_t data, bool bEnd);
void udp_send_data(const void *data, uint16_t size);
