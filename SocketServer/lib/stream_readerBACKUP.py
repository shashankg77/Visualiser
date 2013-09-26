import logging
import socket

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
        log.debug('Added client %s', client)
        if self._stream is None:
            self._connect()
            self._read_stream()

    def remove(self, client):
        self._clients.remove(client)
        log.debug('Removed client %s', client)

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
        log.debug('Connecting to %s', self._address)
        self._stream.connect(self._address)

    def _disconnect(self):
        self._stream.close()
        self._stream = None
        log.debug('Disconnected from %s', self._address)

    @coroutine
    def _read_stream(self):
        log.info('Reading stream from %s', self._address)
        lastVertex=None
        while self._clients:
            
            data = yield Task(self._stream.read_until, "\n")
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
            
            elif '<vertex' in data or ('<edge' in data and 'type="2"' in data):
                resultObject = self.process(data)
                
                if '<vertex' in data:
                    if 'add' in data:
                        start=data.find('id="')+4
                        end=data.find('"',start)
                        lastVertex=data[start:end]
                    if '"add", ' in resultObject and '"vertex",'  in resultObject:
                        for i in range(len(nodes)):
                            if (resultObject[5]==nodes[i][5]):
                                nodes.pop(i)
                                nodes.append(resultObject)
                                resultObject[3]='"update", '
                            elif i==len(nodes)-1:
                                nodes.append(resultObject)
                            
                        if len(nodes)==0:
                           nodes.append(resultObject)
                        
                    
                    elif('"remove", ' in resultObject):
                        for i in range(len(nodes)):
                            if ((resultObject[5]==nodes[i][5])):
                                nodes.pop(i)
                                break
                        for i in range(len(edges)):
                            if resultObject[5]==edges[i][5] or resultObject[5]==edges[i][7]:
                                edges.pop(i)
                        
                elif '<edge' in data:
                    if 'event="add"' in resultObject and '"edge",'  in resultObject:
                        for i in range(len(edges)):
                            if(resultObject[0:8]==edges[i][0:8] and resultObject!=edges[i] ):
                                edges[i]=resultObject
                                resultObject[3]='"update",'
                                break
                            elif (i==len(edges)-1):
                                edges.append(resultObject)
                        if len(edges)==0:
                            self.edges.append(resultObject)
                    elif '"remove", ' in resultObject and '"edge", ' in resultObject:
                        for i in range(len(edges)):
                            if (resultObject[5] == edges[i][5] and resultObject[7] == edges[i][7]) or (resultObject[5] == edges[i][7] and resultObject[7] == edges[i][5]):
                                edges.pop(i)
            if resultObject!=None:            
                resultObject=''.join(resultObject)
                for client in self._clients:
                    print('data: '+data+'\nsending: '+resultObject)
                    self.write_message(client, resultObject)
        self._disconnect()
        return