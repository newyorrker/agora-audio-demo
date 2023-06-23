import { useEffect, useState } from 'react'
import './App.css';

import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { Button } from "./components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Toggle } from "./components/ui/toggle"
import AgoraRTC, { IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';


const agoraEngine = AgoraRTC.createClient({ mode: "rtc", codec: "vp9" });

const initialData = JSON.parse(sessionStorage.getItem("agora-audio-credentials") ?? "{}")


function App() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)

  const [appId, setAppId] = useState(initialData.appId); //"217f1ac51461400989bdd2d6a97bdb8e"
  const [channel, setChannel] = useState(initialData.channel ?? ""); //"test1"
  const [token, setToken] = useState(initialData.token ?? ""); //007eJxTYHgQsKT4hmjSt19OM6/e7SgOrvza8P+rWN2kNVWOC/OjbU4oMBgZmqcZJiabGpqYGZoYGFhaWCalpBilmCVamielJFmkHguamtIQyMiQxv6GkZEBAkF8VoaS1OISQwYGAEpsIkk=
  const [uid, setUid] = useState(0);
  const [joined, setJoined] = useState(false);
  const [micIsOn, setMicIsOn] = useState(true);


  const channelParameters: any =
  {
    // A variable to hold a local audio track.
    localAudioTrack: null,
    // A variable to hold a remote audio track.
    remoteAudioTrack: null,
      // A variable to hold the remote user id.
    remoteUid: null,
  };

  const onJoin = async () => {
      await agoraEngine.join(appId, channel, token, uid);
      // alert("Joined channel: " + channel);

      setJoined(true);
      // Create a local audio track from the microphone audio.
      channelParameters.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      // Publish the local audio track in the channel.
      await agoraEngine.publish(channelParameters.localAudioTrack);
      console.log("Publish success!");
  }

  const onLeave = async () => {
    // Destroy the local audio track.
    channelParameters.localAudioTrack.close();
    // Leave the channel
    await agoraEngine.leave();
    console.log("You left the channel");
    // Refresh the page for reuse
    window.location.reload();
  }

  const getInt = (value: string) => {
    const int = parseInt(value);

    return isNaN(int) ? 0 : int;
  }

  const onDeviceChange = (value: string) => {
    // console.log(agoraEngine.localTracks[0] as IMicrophoneAudioTrack)
    (agoraEngine.localTracks[0] as IMicrophoneAudioTrack).setDevice(value);
    setSelectedDevice(value);
  }

  const toggleMic = (value: boolean) => {
    setMicIsOn(value);
    (agoraEngine.localTracks[0] as IMicrophoneAudioTrack).setEnabled(value);
  }

  useEffect(() => {
    sessionStorage.setItem("agora-audio-credentials", JSON.stringify({appId, channel, token}))
  },[appId, channel, token])

  useEffect(() => {
    AgoraRTC.setLogLevel(0)
    AgoraRTC.getMicrophones().then((value) => {
      setDevices(value)
    })




    agoraEngine.on("user-published", async (user, mediaType) =>
    {
      // Subscribe to the remote user when the SDK triggers the "user-published" event.
      await agoraEngine.subscribe(user, mediaType);
      console.log("subscribe success");

      // Subscribe and play the remote audio track.
      if (mediaType == "audio")
      {
        channelParameters.remoteUid=user.uid;
        // Get the RemoteAudioTrack object from the AgoraRTCRemoteUser object.
        channelParameters.remoteAudioTrack = user.audioTrack;
        // Play the remote audio track.
        channelParameters.remoteAudioTrack.play();
        // alert("Remote user connected: " + user.uid);
      }

      // Listen for the "user-unpublished" event.
      agoraEngine.on("user-unpublished", user =>
      {
        console.log(user.uid + "has left the channel");
        // alert("Remote user has left the channel");
      });
    });

  }, [])

  return (
    <>
      <div>
        {selectedDevice}
      </div>
      <div className='max-w-md'>
        <Label htmlFor="appid">Appid</Label>
        <Input value={appId} onChange={e => setAppId(e.target.value)} id="appid" />

        <Label htmlFor="channel">Channel</Label>
        <Input value={channel} onChange={e => setChannel(e.target.value)} id="channel" />

        <Label htmlFor="token">Token</Label>
        <Input value={token} onChange={e => setToken(e.target.value)} id="token" />

        <Label htmlFor="uid">Uid</Label>
        <Input value={uid} onChange={e => setUid(getInt(e.target.value))} id="uid" />

        <br />
        <br />

        { joined ?
          (
            <>
              <Select onValueChange={onDeviceChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map(device => <SelectItem value={device.deviceId}>{device.label}</SelectItem>) }
                </SelectContent>
              </Select>
<br />
              <div>Mic is enabled: {micIsOn.toString()}</div>
              <Toggle variant={'outline'} pressed={micIsOn} onPressedChange={toggleMic}>
                {micIsOn ? "turn off" : "turn on"}
              </Toggle>
            </>
          ): null }

        <br />
        <br />

        {joined ? null : <Button onClick={onJoin} >Join</Button>}
        <Button onClick={onLeave} >Leave</Button>
      </div>
    </>
  )
}

export default App
