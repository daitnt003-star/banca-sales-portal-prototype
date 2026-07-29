#!/usr/bin/env python3
"""Máy chủ demo cho prototype — luôn trả nội dung mới nhất.

Vì sao cần: prototype là HTML tĩnh, mã của từng màn hình nằm ngay trong file HTML
của màn hình đó. Máy chủ mặc định (python3 -m http.server) không gửi header cache
nên trình duyệt tự ý giữ lại bản HTML cũ — sửa xong mở lại vẫn thấy giao diện cũ.

Chạy tại thư mục prototype/sprint1:
    python3 scripts/serve.py            # cổng mặc định 8899
    python3 scripts/serve.py 9000       # chỉ định cổng
"""
import functools
import http.server
import os
import socketserver
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):
        if '404' in (fmt % args):
            super().log_message(fmt, *args)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8899
    handler = functools.partial(NoCacheHandler, directory=ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('127.0.0.1', port), handler) as httpd:
        print('Prototype đang chạy: http://127.0.0.1:%d/index.html' % port)
        print('Thư mục gốc: %s' % ROOT)
        print('Mọi phản hồi đều gửi kèm no-store — sửa file xong chỉ cần tải lại trang.')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nĐã dừng máy chủ.')


if __name__ == '__main__':
    main()
