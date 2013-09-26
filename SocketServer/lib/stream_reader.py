import logging
import socket
import copy

from tornado.iostream import SSLIOStream
from tornado.gen import coroutine, Task


log = logging.getLogger(__name__)
nodes=[]
edges=[]

class SSLStreamReader(object):
    def __init__(self, host, port):
        self._address = (host, port)
        self._stream = None
        self._clients = set()

    def add(self, client):
        self._clients.add(client)
        log.info('Added client %s', client)
        for i in nodes:
            self.write_message(client,''.join(i))
        for i in edges:
            self.write_message(client,''.join(i))
        
        
        if self._stream is None:
            self._connect()
            self._read_stream()

    def remove(self, client):
        self._clients.remove(client)
        log.info('Removed client %s', client)
    
    @staticmethod
    def process(data):
        return data

    @staticmethod
    def write_message(client, data):
        pass

    def _connect(self):
        nodes=[]
        edges=[]
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM, 0)
        self._stream = SSLIOStream(s)
        log.info('Connecting to %s', self._address)
        self._stream.connect(self._address)

    def _disconnect(self):
        self._stream.close()
        self._stream = None
        log.info('Disconnected from %s', self._address)

    @coroutine
    def _read_stream(self):
        log.info('Reading stream from %s', self._address)
        lastVertex=None
        while self._clients:
            
            data = yield Task(self._stream.read_until, ">\n")
            resultObject=None
            if '<hwstats' in data:
                result=None
                if lastVertex==None:
                    resultObject=None
                else:
                    result=[]
                    result.append('{"type":"vertex", "event":"update", ')
                    result.append('"id":')
                    result.append(lastVertex)
                    result.append(', "details":{"Temperature":')
                    Start=data.find('temperature="')+13
                    End=data.find('" ',Start)
                    result.append(data[Start:End])
                    result.append(', "Hostname":')
                    Start=data.find('hostname="')+9
                    End=data.find('"',Start+1)+1
                    result.append(data[Start:End])
                    result.append(', "CPU":')
                    Start=data.find('" cpuLoad="')+11
                    End=data.find('" ',Start)
                    result.append(data[Start:End])
                    result.append(', "Free Memory":')
                    Start=data.find('freeMem="')+9
                    End=data.find('" ',Start)
                    result.append(data[Start:End])
                    result.append('}}')
                resultObject=result
                lastVertex=None
            
            elif '<vertex' in data or ('<edge' in data and ('type="2"' in data or 'type="3"' in data)):
                resultObject = self.process(data)
                
                if '<vertex' in data:
                    if 'add' in data:
                        start=data.find('id="')+4
                        end=data.find('"',start)
                        lastVertex=data[start:end]
                    if 'event="add"' in data:
                        for i in range(len(nodes)):
                            if (resultObject[5]==nodes[i][5]):
                                del nodes[i]
                                nodes.append(copy.deepcopy(resultObject))
                                resultObject[3]='"update", '
                                break
                            elif i==len(nodes)-1:
                                nodes.append(copy.deepcopy(resultObject))
                            
                        if len(nodes)==0:
                           nodes.append(copy.deepcopy(resultObject))
                        
                    
                    elif('event="remove"' in data):
                    
                        for i in range(len(nodes)):
                            if ((resultObject[5]==nodes[i][5])):
                                del nodes[i]
                                break
                        for i in range(len(edges)):
                            if resultObject[5]==edges[i][5] or resultObject[5]==edges[i][7]:
                                del edges[i]
                        
                elif '<edge' in data:
                    if 'event="add"' in data:
                        for i in range(len(edges)):
                            if((resultObject[7] == edges[i][7] and resultObject[9] == edges[i][9]) or (resultObject[7] == edges[i][9] and resultObject[9] == edges[i][7] )) and resultObject[3] == edges[i][3]:
                                del edges[i]
                                edges.append(copy.deepcopy(resultObject))
                                resultObject[5]='"update", '
                                break
                            elif (i==len(edges)-1):
                                edges.append(copy.deepcopy(resultObject))
                        if len(edges)==0:
                            edges.append(copy.deepcopy(resultObject))
                    elif 'event="remove"' in data:
                        for i in range(len(edges)):
                            if ((resultObject[7] == edges[i][7] and resultObject[9] == edges[i][9]) or (resultObject[7] == edges[i][9] and resultObject[9] == edges[i][7])) and resultObject[3] == edges[i][3]:
                                del edges[i]
                                break
            if resultObject!=None:
                resultObject=''.join(resultObject)
                for client in self._clients:
                    self.write_message(client, resultObject)
        self._disconnect()
        return
