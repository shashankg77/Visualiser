#!/usr/bin/env python

"""
An HTTP & web socket server that reads from a TLS server stream and writes all
data to connected web socket clients.
"""

import os
import logging
import socket
from datetime import datetime

from tornado.web import Application, RequestHandler, asynchronous
from tornado.websocket import WebSocketHandler
from tornado.iostream import SSLIOStream
from tornado.ioloop import IOLoop
from tornado import options

from lib.stream_reader import SSLStreamReader


log = logging.getLogger(__name__)
port = 8888
tls_host = 'jane'
tls_port = 5000


class CustomReader(SSLStreamReader):
    @staticmethod
    def process(line):
		edge='<edge'
		vertex='<vertex'
		direct='type="2"'
		indirect='type="3"'
		resultObject=[]
		
		if vertex in line:
			toSend=True
			resultObject.append('{"type":')
			resultObject.append('"vertex", ')
			resultObject.append('"event":')
			
			if 'event="add"' in line:
				resultObject.append('"add", ')
			else:
				resultObject.append('"remove", ')
			
			resultObject.append('"id":')
			start=line.find('id="')+4
			end=line.find('"',start)
			resultObject.append(line[start:end])
			resultObject.append(', "details":{}}')
		
		elif edge in line and (direct in line or indirect in line):
			toSend=True
			resultObject.append('{"type":')
			resultObject.append('"edge", ')
			resultObject.append('"SAtype":')
			if(direct in line):
				resultObject.append('"direct", ')
			else:
				resultObject.append('"indirect", ')
			resultObject.append('"event":')
			
			if 'event="add"' in line:
				resultObject.append('"add", ')
			else:
				resultObject.append('"remove", ')
			
			start=line.find('from="')+6
			end=line.find('" to="')
			resultObject.append('"from":')
			resultObject.append((line[start:end]))
			
			start=end+6
			end=line.find('" timestamp')
			resultObject.append(', "to":')
			resultObject.append(line[start:end])
			
			if resultObject[5]=='"add", ':
				resultObject.append(', "details":{"Delay":')
				start=line.find('" delay="')+9
				end=(line.find('"',start))
				resultObject.append(line[start:end])
				
				resultObject.append(', "Jitter":')
				start=line.find('" jitter="')+10
				end=(line.find('"',start))
				resultObject.append(line[start:end])
				
				resultObject.append(', "Drop Rate":')
				start=line.find('dropRate="')+10
				end=line.find('"',start)
				resultObject.append(line[start:end])
				
				resultObject.append(', "Link Quality":')
				start=line.find('linkQuality="')+13
				end=line.find('"',start)
				resultObject.append(line[start:end])
				
				resultObject.append(', "Establised For":')
				start=line.find('establishedFor="')+16
				end=line.find('"',start)
				resultObject.append(line[start:end])
				
				resultObject.append(', "Establish Rate":')
				start=line.find('establishRate="')+15
				end=line.find('"',start)
				resultObject.append(line[start:end])
				
				resultObject.append('}')
			resultObject.append('}')
		else:
			resultObject=None
		return resultObject

    @staticmethod
    def write_message(client, data):
		print datetime.now()
		client.write_message(data)


class RootHandler(RequestHandler):
    def get(self):
        self.render('index.html')

class FeedHandler(WebSocketHandler):
    feed = CustomReader(tls_host, tls_port)

    def open(self):
        FeedHandler.feed.add(self)

    def on_close(self):
        FeedHandler.feed.remove(self)

	


settings = {
    'template_path': os.path.join(os.path.dirname(__file__), 'html')
}
routes = [
    (r'/', RootHandler),
    (r'/feed', FeedHandler)
]

if __name__ == "__main__":
    options.parse_command_line()
    application = Application(routes, **settings)
    application.listen(port)
    log.info('Listening on port %d...', port)
    IOLoop.instance().start()
