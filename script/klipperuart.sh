#!/bin/sh

while :
do
if ! ps aux | grep -w socat | grep -v grep >/dev/null 2>&1
then
#socat -d -d -s PTY,link=/tmp/tcpserial,echo=0,rawer,unlink-close=0,ignoreeof,waitslave UDP:klipperesp.local:5000,reuseaddr,sourceport=5000,dontroute,ignoreeof,forever
#socat -d -d -s PTY,link=/tmp/tcpserial,rawer,unlink-close=0,nonblock,ignoreeof UDP:klipperesp.local:5000,sourceport=5000,dontroute,ignoreeof
#socat -d -d -d -d -s PIPE:/tmp/klipper_host_mcu,unlink-close=0,ignoreeof,nonblock,echo=0 UDP:klipperesp.local:5000,reuseaddr,sourceport=5000,dontroute,ignoreeof


#socat -d -d -s PTY,link=/tmp/tcpserial,echo=0,rawer,unlink-close=0,ignoreeof,waitslave TCP:klipperesp.local:5000,nodelay,dontroute,ignoreeof,forever
socat -d -d -s TCP:klipperesp.local:5000,nodelay,dontroute,ignoreeof PTY,link=/tmp/tcpserial,echo=0,rawer,unlink-close=0,ignoreeof

#socat -d -d -s PTY,link=/tmp/tcpserial,raw,nonblock,ignoreeof,echo=0  UDP:klipperesp.local:5000,dontroute
echo ---------------restart-----------------------
sleep 1
fi
done
