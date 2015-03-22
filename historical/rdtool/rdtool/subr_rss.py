# rdtool/subr_rss.py

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

""" Fetch the RSS feeds of a website """

import getopt
import logging
import sys

if __name__ == "__main__":
    sys.path.insert(0, ".")

from rdtool import subr_http

PATHS = (
         "/rss",      # tumblr.com
         "/feed/",    # wordpress.com
         "/rss.xml",  # blogspot.it
        )

def fetch(site, bodyvec, encodings):
    """ Fetch the RSS feeds of a website """

    for path in PATHS:
        logging.info("subr_rss: try with %s for %s", path, site)

        del bodyvec[:]
        del encodings[:]
        headers = {}

        result = subr_http.retrieve("GET", "http", site, path, bodyvec,
                                    [], headers)
        if result != 200:
            continue

        ctype = headers.get("content-type")
        if not ctype:
            logging.warning("subr_rss: no content-type")
            continue

        ctype, encoding = subr_http.parse_content_type(ctype)
        if (
            ctype != "application/atom+xml" and
            ctype != "application/rss+xml" and
            ctype != "text/xml" and
            ctype != "application/xml"
           ):
            logging.warning("subr_rss: bad content type: %s", ctype)
            continue

        encodings.append(encoding)
        return 0

    logging.error("subr_rss: can't fetch RSS for %s", site)
    return -1

def main():
    """ Main function """
    try:
        options, arguments = getopt.getopt(sys.argv[1:], "o:v")
    except getopt.error:
        sys.exit("usage: subr_rss.py [-v] [-o output] site")
    if len(arguments) != 1:
        sys.exit("usage: subr_rss.py [-v] [-o output] site")

    level = logging.WARNING
    outfp = sys.stdout
    for name, value in options:
        if name == "-o":
            outfp = open(value, "w")
        elif name == "-v":
            level = logging.DEBUG

    logging.getLogger().setLevel(level)

    bodyvec = []
    encodings = []

    status = fetch(arguments[0], bodyvec, encodings)
    if status != 0:
        sys.exit(1)
    body = "".join(bodyvec)
    if encodings and encodings[0]:
        body = body.decode(encodings[0])
        body = body.encode("utf-8")

    outfp.write(body)

if __name__ == "__main__":
    main()
