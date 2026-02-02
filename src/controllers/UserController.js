import { catchAsync } from "../utils/catchAsync.js";
import chatRoom from '../services/chat-room.js';

export const getUsers = catchAsync(async (req, res, next) => {
  const users = chatRoom.listUsers();
  const count = chatRoom.count();

  res.status(200).json({
    status: 'success',
    count,
    users,
  })
});