# rdtool/subr_misc.py

#
# Copyright (c) 2013 Simone Basso <bassosimone@gmail.com>
#
# Permission to use, copy, modify, and distribute this software for any
# purpose with or without fee is hereby granted, provided that the above
# copyright notice and this permission notice appear in all copies.
#
# THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
# WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
# MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
# ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
# WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
# ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
# OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
#

""" Miscellaneous subroutines """

import collections
import logging
import os

def make_post_folder(site, bitlink):
    """ Generate post folder from site and bitlink """

    site = site.split(".")
    if site[0] == "www" and len(site) >= 2:
        site = site[1]
    else:
        site = site[0]

    return os.sep.join([site, bitlink])

def mkdir_recursive_idempotent(path):
    """ Create the directories indicated by path (idempotent) """
    pathv = path.split(os.sep)
    pathv = collections.deque(pathv)
    curpath = ""
    while pathv:
        entry = pathv.popleft()
        if not entry:
            entry = "/"  # XXX
        if curpath:
            curpath += os.sep
        curpath += entry
        if os.path.exists(curpath):
            if not os.path.isdir(curpath):
                logging.warning("subr_misc: not a directory")
                return False
            continue
        os.mkdir(curpath, 0755)
    if not os.path.isdir(path):
        logging.warning("subr_misc: internal error")
        return False
    return True

def readfile(path, maxlen):
    """ Read configuration """
    filep = open(path, "r")
    filep.seek(0, os.SEEK_END)
    total = filep.tell()
    filep.seek(0, os.SEEK_SET)
    if total > maxlen:
        logging.warning("readfile: file too large")
        return
    data = filep.read()
    filep.close()
    return data

