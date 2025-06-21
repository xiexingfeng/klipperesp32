// Example code for running timers in a polling mode
//
// Copyright (C) 2018  Kevin O'Connor <kevin@koconnor.net>
//
// This file may be distributed under the terms of the GNU GPLv3 license.

#include <time.h>       // struct timespec
#include <unistd.h>     // usleep
#include "autoconf.h"   // CONFIG_CLOCK_FREQ
#include "board/irq.h"  // irq_disable
#include "board/misc.h" // timer_from_us
#include "board/timer_irq.h" // timer_dispatch_many
#include "command.h" // DECL_CONSTANT
#include "sched.h"   // DECL_INIT

#include "driver/timer.h"
// #include <Ticker.h>
#include "fastio.h"
// #include "esp32s3/rom/ets_sys.h"
// #include "esp32s3/rom/gpio.h"
#include "hal/timer_ll.h"
// #include "freertos/portmacro.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"


#define TIMER_DIVIDER (2)                            //  Hardware timer clock divider
#define TIMER_SCALE (TIMER_BASE_CLK / TIMER_DIVIDER) // convert counter value to seconds

#define TIMER_GROUP_NUM TIMER_GROUP_0
#define TIMER_IDEX_NUM TIMER_0
#define TIMER_RG TIMERG0.hw_timer[TIMER_IDEX_NUM]

/*

1、返回定时器当前计算；
2、定时器为向上计数，并不自动重载；
3、每次设置定时器发时间点
*/

static void
__always_inline IRAM_ATTR timer_set(uint32_t next)
{
    TIMER_RG.update.tn_update = 1;
    while (TIMER_RG.update.tn_update) {}    
    if(unlikely(TIMER_RG.lo.tn_lo > next)){
        TIMER_RG.alarmhi.tn_alarm_hi = TIMER_RG.hi.tn_hi + 1;
    }
    TIMER_RG.alarmlo.tn_alarm_lo = next;
}

/****************************************************************
 * Timers
 ****************************************************************/
//返回当前系统的tick，供给klipper使用
// Return the current time (in absolute clock ticks).
uint32_t __always_inline IRAM_ATTR timer_read_time(void)
{
    TIMER_RG.update.tn_update = 1;
    while (TIMER_RG.update.tn_update) {}
    return TIMER_RG.lo.tn_lo;
}

//尽快进入定时器中断
// Activate timer dispatch as soon as possible
void __always_inline IRAM_ATTR timer_kick(void)
{
    timer_set(timer_read_time() + 50);
}
//虚拟定时器，以避免调试大于0xffffff的定时器
// Dummy timer to avoid scheduling a SysTick irq greater than 0xffffff
static uint_fast8_t
timer_wrap_event(struct timer *t)
{
    t->waketime += 0xffffff;
    return SF_RESCHEDULE;
}
static struct timer wrap_timer = {
    .func = timer_wrap_event,
    .waketime = 0xffffff,
};
void timer_reset(void)
{
    if (timer_from_us(100000) <= 0xffffff)
        // Timer in sched.c already ensures SysTick wont overflow
        return;
    sched_add_timer(&wrap_timer);
}
DECL_SHUTDOWN(timer_reset);

static void  IRAM_ATTR timer_handler_isr(void *para);

//初始化定时器，由于库中有同名的timer_init， 所以改名
void ktimer_init(void)
{
    // Schedule a recurring timer on fast cpus
    timer_reset();

//     uint32_t configval = TIMER_RG.config.val;
//     timg_tnconfig_reg_t config;
//     config.val = configval;

//     config.tn_alarm_en = true;//到达计数值启动报警（计数值溢出，进入中断）
//     config.tn_en = true;//调用timer_init函数以后不启动计数,调用timer_start时才开始计数
//     config.tn_increase = true;//计数方式为向上计数
//     config.tn_autoreload = false;//自动重新装载预装值
//     config.tn_divider = TIMER_DIVIDER;//分频系数
//     config.tn_use_xtal = false;

//     TIMER_RG.config.val = configval;

// //设置报警阈值
//     TIMER_RG.alarmhi.val = 0;
//     TIMER_RG.alarmlo.val = 0;
// /*设置定时器预装值*/    
//     TIMER_RG.hi.val = 0;
//     TIMER_RG.lo.val = 0;
//     //定时器中断使能
//     TIMERG0.int_ena_timers.val |= BIT(TIMER_IDEX_NUM);
// //注册定时器中断函数
// //无法设置中断函数
// ets_isr_attach(ETS_TG0_T0_INUM, timer_handler_isr, NULL);
//     // ETS_TG0_T0_INTR_ATTACH(timer_handler_isr, NULL);



    /**
     * 设置定时器初始化参数
     */
    timer_config_t config = {
        .alarm_en = TIMER_ALARM_EN,          //到达计数值启动报警（计数值溢出，进入中断）
        .counter_en = TIMER_PAUSE,           //调用timer_init函数以后不启动计数,调用timer_start时才开始计数
        .counter_dir = TIMER_COUNT_UP,     //计数方式为向下计数
        .auto_reload = TIMER_AUTORELOAD_DIS, //自动重新装载预装值
        .divider = TIMER_DIVIDER,            //分频系数
        .clk_src = TIMER_SRC_CLK_APB,

    };
    /**
     * 初始化定时器
     *    TIMER_GROUP_NUM(定时器分组0)
     *    TIMER_IDEX_NUM(0号定时器)
     */
    timer_init(TIMER_GROUP_NUM, TIMER_IDEX_NUM, &config);

    /*设置定时器预装值*/
    timer_set_counter_value(TIMER_GROUP_NUM, TIMER_IDEX_NUM, 0);

    /**
     * 设置报警阈值
     *    1000[定时1000ms] (TIMER_BASE_CLK[定时器时钟/8[分频系数]/1000[延时为ms级别，因此除以1000])
     */
    timer_set_alarm_value(TIMER_GROUP_NUM, TIMER_IDEX_NUM, 50); // TIMER_BASE_CLK 为80M

    //定时器中断使能
    timer_enable_intr(TIMER_GROUP_NUM, TIMER_IDEX_NUM);
    /**
     * 注册定时器中断函数
     */
    timer_isr_register(TIMER_GROUP_NUM, TIMER_IDEX_NUM,
                       timer_handler_isr,                         //定时器中断回调函数
                       (void *)TIMER_IDEX_NUM,                    //传递给定时器回调函数的参数
                       ESP_INTR_FLAG_LOWMED , //把中断放到 IRAM 中
                       NULL                                       //调用成功以后返回中断函数的地址,一般用不到
    );
    /*启动定时器*/
    timer_start(TIMER_GROUP_NUM, TIMER_IDEX_NUM); //开始计数

    // // log_i("timer_wrap_event:0x%x", &timer_wrap_event);


}
DECL_INIT(ktimer_init);

/**
 * 定时器中断函数
 需要先清除定时器中断状态
 运行中断处理klipper命令
 返回diff
 设置diff
 启用定时器中断
 */
static void  IRAM_ATTR timer_handler_isr(void *para)
{
    // log_i("timer_handler_isr, now: %u", timer_read_time());
    // OUT_WRITE(141, HIGH);
    // static int i = 0;
    // i++;
    // if ((i % 2) == 0)
    //     TOGGLE(141);
    // timer_group_clr_intr_status_in_isr(TIMER_GROUP_NUM, TIMER_IDEX_NUM);
    TIMERG0.int_clr_timers.val |= BIT(TIMER_IDEX_NUM);
    irq_disable();
    uint32_t next = timer_dispatch_many();
    timer_set(next);
    irq_enable();
    // timer_group_enable_alarm_in_isr(TIMER_GROUP_NUM, TIMER_IDEX_NUM);
    TIMER_RG.config.tn_alarm_en = true;

    // ESP_LOGE("timer", "--------------------------\n");
}

void __always_inline IRAM_ATTR irq_disable(void)
{
    portDISABLE_INTERRUPTS();
    // 禁用硬件中断
    // cli();
    // barrier();
}

void __always_inline IRAM_ATTR irq_enable(void)
{
    portENABLE_INTERRUPTS();
    // 启用硬件中断    
    // barrier();
    // sei();
}

irqstatus_t
__always_inline IRAM_ATTR irq_save(void)
{
    irqstatus_t flag = 0;
    flag = xthal_get_intenable();
    irq_disable();
    return flag;
}

void __always_inline IRAM_ATTR irq_restore(irqstatus_t flag)
{
    // barrier();
    // irq_enable();
    xthal_set_intenable(flag);
}

void __always_inline IRAM_ATTR irq_wait(void)
{
    // 启用硬件中断    
    // barrier();
    // sei();    

    // // 禁用硬件中断
    // cli();
    // barrier();    
    irq_enable();
    // ets_delay_us(1); 
    vTaskDelay(1); 
    irq_disable();  
}

void __always_inline IRAM_ATTR irq_poll(void)
{
    
}
