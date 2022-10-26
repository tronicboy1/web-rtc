import { getDatabase, set, ref as getRef, onValue } from "firebase/database";
import { app } from "./firebase";

type Message = { sender: string; value: string };
type Content = { description?: RTCSessionDescription; candidate?: RTCIceCandidate };

export class SignalingChannel {
  private db = getDatabase(app);
  private ref: ReturnType<typeof getRef>;
  public lastMessage: Message | undefined;
  public unsubscribe: ReturnType<typeof onValue> = () => 0;

  constructor(
    private senderId = `${Math.random().toString(20).substring(3, 8)}-${Date.now()}`,
    private roomName = "room"
  ) {
    this.ref = getRef(this.db, this.roomName);
  }

  public send(value: Content) {
    const message: Message = { sender: this.senderId, value: JSON.stringify(value) };
    set(this.ref, message);
  }

  public subscribe(callback: (message: Content) => void) {
    this.unsubscribe = onValue(this.ref, (snapshot) => {
      const data = snapshot.val() as Message | null;
      if (!data) return;
      if ((data.sender = this.senderId)) return;
      callback(JSON.parse(data.value));
    });
  }
}
