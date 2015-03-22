#!/bin/sh -e

#
# Copyright (c) 2014
#     Nexa Center for Internet & Society, Politecnico di Torino (DAUIN),
#     Alessio Melandri <alessiom92@gmail.com> and
#     Simone Basso <bassosimone@gmail.com>.
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
#

#
# Rules for iptables
#

IPTABLES=/sbin/iptables
SUDO=/usr/bin/sudo

$SUDO $IPTABLES -t mangle -A PREROUTING -p tcp --dport 8080 \
    -j MARK --set-mark 1

$SUDO $IPTABLES -t mangle -A PREROUTING -p tcp --dport 4443 \
    -j MARK --set-mark 1

$SUDO $IPTABLES -t nat -A PREROUTING -p tcp --dport 443 \
    -j REDIRECT --to-port 4443

$SUDO $IPTABLES -t nat -A PREROUTING -p tcp --dport 80 \
    -j REDIRECT --to-port 8080

$SUDO $IPTABLES -t filter -A INPUT -m mark --mark 1 -j REJECT
