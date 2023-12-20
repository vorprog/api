import { RequestListener } from "node:http";
import { VerifyJwt, GetHttpRequestBody, Log } from './utility';

const subnetBlacklist: string[] = [];
const webRTCConnections = {};

export const httpHandler: RequestListener = async (request, response) => {
  for (const subnet of subnetBlacklist) {
    if (!request.socket.remoteAddress || request.socket.remoteAddress.startsWith(subnet)) {
      Log({ blocked: request.socket.remoteAddress});
      return;
    }
  }

  const requestObject = {
    method: request.method,
    url: request.url,
    headers: request.headers,
    httpVersion: request.httpVersion,
    remotePort: request.socket.remotePort,
    remoteAddress: request.socket.address(),
    remoteRemoteAddress: request.socket.remoteAddress,
    remoteFamily: request.socket.remoteFamily,
    localPort: request.socket.localPort,
    localAddress: request.socket.address(),
    localLocalAddress: request.socket.localAddress,
    localFamily: request.socket.localFamily
  };

  Log(requestObject);

  if (request.headers['authorization']) {
    const token = request.headers['authorization'].split(' ')[1];
    if (!VerifyJwt(token)) {
      response.writeHead(401, { 'Content-Type': 'text/plain' });
      response.end('Unauthorized\n');
      return;
    }
  }

  if (request.method === 'GET') {
    if (request.url === '/health') {
      response.writeHead(200, { 'Content-Type': 'text/plain' });
      response.end('OK\n');
      return;
    }

    if (request.url === '/metrics') {
      response.writeHead(200, { 'Content-Type': 'text/plain' });
      response.end('OK\n');
      return;
    }



    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(requestObject) + '\n');
    return;
  }

  if (request.method === 'POST') {
    const body = await GetHttpRequestBody(request);
    const bodyJson = JSON.parse(body);

    if (request.url === '/upgrade/webrtc') {
      const peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (offer.sdp) webRTCConnections[offer.sdp] = peerConnection;
      else throw new Error('offer.sdp is undefined');

      const dataChannel = peerConnection.createDataChannel('data-channel');
      dataChannel.send('hello from server');
      dataChannel.onmessage = (event) => console.log(event.data);
    }

    if (request.url === '/answer/webrtc') {
      const remoteDescription = new RTCSessionDescription(bodyJson.sdp);
      const peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      webRTCConnections[bodyJson.sdp] = peerConnection;

      await peerConnection.setRemoteDescription(remoteDescription);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      const dataChannel = peerConnection.createDataChannel('data-channel');
      dataChannel.send('hello from server');
      dataChannel.onmessage = (event) => console.log(event.data);

      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ sdp: answer.sdp }));
      return;
    }

    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('POST request\n');
    return;
  }

  if (request.method === 'PUT') {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('PUT request\n');
    return;
  }

  if (request.method === 'DELETE') {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('DELETE request\n');
    return;
  }

  response.writeHead(405, { 'Content-Type': 'text/plain' });
  response.end('Method Not Allowed\n');
}

