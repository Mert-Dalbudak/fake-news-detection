import socket, json, spacy, numpy as np

nlp = spacy.load("de_core_news_md")

def parse_entity(entity):
    #return {'value': entity.text, 'type': entity.label_, 'start_char': entity.start_char}
    return {'value': entity.text, 'type': entity.label_}

# VOID stdout
def process(text):
    doc = nlp(text)
    output = {
        "nouns": [chunk.text for chunk in doc.noun_chunks],
        "entities": [parse_entity(entity) for entity in doc.ents],
        "lemma": [token.lemma_ for token in doc if token.pos_ == "VERB"]
    }
    return json.dumps(output, ensure_ascii=False)

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.bind(("localhost", 15555))
s.listen(5)


# Create a TCP/IP socket to tell main process service is ready
ready = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server_address = ('localhost', 49152)
print('Connecting to main process')
ready.connect(server_address)


try:
    # Send data
    message = b'spacy ready'
    print('Sending ready status to main process')
    ready.sendall(message)
finally:
    print('closing socket')
    ready.close()

while True:
    clientsocket, address = s.accept()
    print(f"Connection from {address} has been established.")
    msg = clientsocket.recv(1024)
    response = process(msg.decode('utf-8'))
    clientsocket.send(bytes(response, "utf-8"))
    clientsocket.close()
    print(f"Connection to {address} has been resolved.")