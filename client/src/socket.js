import { io } from "socket.io-client";

const socket = io(import.meta.env.REACT_APP_API_URL);

export default socket;