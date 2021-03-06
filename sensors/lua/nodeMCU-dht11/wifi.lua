wifi.sta.config(WIFI_SSID, WIFI_PWD)
wifi.sta.autoconnect(WIFI_AUTOCONNECT)
wifi.setmode(wifi.STATION)

tmr.alarm(0, 1000, 1, function()
    if wifi.sta.getip() == nil then
        print("Connecting to ssid ", WIFI_SSID)
    else
        ip, nm, gw=wifi.sta.getip()
        print("Wifi Status:\t\t", getStatusString(wifi.sta.status()))
        print("Wifi mode:\t\t", getModeString(wifi.getmode()))
        print("IP Address:\t\t", ip)
        print("IP Netmask:\t\t", nm)
        print("IP Gateway Addr:\t", gw)
        print("DNS 1:\t\t\t", net.dns.getdnsserver(0))
        print("DNS 2:\t\t\t", net.dns.getdnsserver(1))
        tmr.stop(0)
    end
end)