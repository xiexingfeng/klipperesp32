#include <stdio.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <string.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <stdlib.h>
#include <pthread.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <stdio.h>

#include <pty.h>

#include <errno.h>

void *recv_msg(void *arg); //接收消息

int ptyfd = -1, ttyfd = -1;

#define MAXPTYNAMELEN 64
char ptyname[MAXPTYNAMELEN];

#define PTY_BUFF_MAX_LEN        1024

int main(int argc, char *argv[])
{

    openpty(&ptyfd, &ttyfd, ptyname, NULL, NULL);


    printf("Get a pty pair, FD -- master[%d], slave[%d]\n", ptyfd, ttyfd);
    printf("Slave name is %s\n", ptyname);

//    close(ttyfd);

unlink("/tmp/tcpserial");
   symlink(ptyname, "/tmp/tcpserial");

   perror("symlink\n");

    //将接收端口号并转换为int
    int port = 5000;

    // 1.创建udp通信socket, 发送数据
    int udp_socket_fd = socket(AF_INET, SOCK_DGRAM, 0);
    if (udp_socket_fd < 0)
    {
        perror("creat socket fail\n");
        return -1;
    }

    // 2.设置UDP的地址并绑定
    struct sockaddr_in local_addr = {0};
    local_addr.sin_family = AF_INET;         //使用IPv4协议
    local_addr.sin_port = htons(port);       //网络通信都使用大端格式
    local_addr.sin_addr.s_addr = INADDR_ANY; //让系统检测本地网卡，自动绑定本地IP

    int ret = bind(udp_socket_fd, (struct sockaddr *)&local_addr, sizeof(local_addr));
    if (ret < 0)
    {
        perror("bind fail:");
        close(udp_socket_fd);
        return -1;
    }

    //启动接收线程
    pthread_t recv_thread;
    pthread_create(&recv_thread, NULL, recv_msg, (void *)&udp_socket_fd);

    //设置目的IP地址
    struct sockaddr_in dest_addr = {0};
    dest_addr.sin_family = AF_INET; //使用IPv4协议

    int dest_port = 5000;   //目的端口号
    char dest_ip[32] = {0}; //目的IP
    char buf[1024] = {0};
    dest_addr.sin_port = htons(dest_port);                   //设置接收方端口号
    dest_addr.sin_addr.s_addr = inet_addr("192.168.200.32"); //设置接收方IP
    //循环发送消息


fd_set rfds;
    FD_ZERO(&rfds);
    FD_SET(ptyfd, &rfds);
int rv = 0, n = 0;

    while (1)
    {
        rv = select(ptyfd + 1, &rfds, NULL, NULL, NULL);
        if (rv < 0)
        {
            perror("Failed to select");
            return -1;
        }

        if (FD_ISSET(ptyfd, &rfds))
        {
            n = read(ptyfd, buf, PTY_BUFF_MAX_LEN);
            if (n > 0)
            {
                //    memset(buf+n, 0, PTY_BUFF_MAX_LEN-n);
                // printf("recv [%d] bytes:[%s]\n", n, buf);
                // printf("read pty [%d]\n", n);
                sendto(udp_socket_fd, buf, n, 0, (struct sockaddr *)&dest_addr, sizeof(dest_addr));
            }
            else if (n == 0)
            {
                printf("Slave closed\n");
                // break;
            }
            else
            {

                   
                
                perror("Failed to read the master\n");
                 continue;
            }
        }
    }

    // while (1)
    // {
    //     int len = read( pipefd, buf, sizeof(buf) );
    //     if(len>0){
    //          perror("read:");
    //          sendto(udp_socket_fd, buf, len, 0, (struct sockaddr *)&dest_addr, sizeof(dest_addr));
    //          perror("read2:");
    //     }

    // }

    // 4 关闭通信socket
    close(udp_socket_fd);

    return 0;
}

//接收线程所要执行的函数 接收消息
void *recv_msg(void *arg)
{
    int ret = 0;
    int *socket_fd = (int *)arg;       //通信的socket
    struct sockaddr_in src_addr = {0}; //用来存放对方(信息的发送方)的IP地址信息
    int len = sizeof(src_addr);        //地址信息的大小
    char msg[1024] = {0};              //消息缓冲区
    // int wpipefd = open(PIPE_NAME, O_WRONLY);
    //循环接收客户发送过来的数据
    while (1)
    {
        ret = recvfrom(*socket_fd, msg, sizeof(msg), 0, (struct sockaddr *)&src_addr, &len);
        // printf("recvfrom %d\n", ret);
        if (ret > 0)
        {
            // perror("recv:");
            write(ptyfd, msg, ret);
            // perror("write ");
        }

        // printf("[%s : %d] \n", inet_ntoa(src_addr.sin_addr), ntohs(src_addr.sin_port)); //打印消息发送方的ip与端口号
        // printf("The data is %s\n", msg);
        // if (strcmp(msg, "exit") == 0 || strcmp(msg, "") == 0)
        // {
        //     //通知主线程。。。
        //     break;
        // }
        // memset(msg, 0, sizeof(msg)); //清空存留消息
    }
    //关闭通信socket
    close(*socket_fd);

    return NULL;
}

