import { Response } from 'express';
import { User } from '../models/User';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../config/logger';

export const getCreators = async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string || '';

  try {
    const query: any = { isBanned: false };
    if (search) {
      query.username = { $regex: search, $options: 'i' };
    }

    const creators = await User.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('username avatar bio role vipLevel followers following')
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    return sendSuccess(res, 'Creators listed successfully', {
      creators,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error: any) {
    return sendError(res, 'Failed to fetch creators', error.message, 500);
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id)
      .populate('followers', 'username avatar vipLevel')
      .populate('following', 'username avatar vipLevel')
      .populate('friends', 'username avatar vipLevel');

    if (!user) {
      return sendError(res, 'User profile not found', null, 404);
    }

    return sendSuccess(res, 'Profile retrieved', user);
  } catch (error: any) {
    return sendError(res, 'Failed to fetch profile', error.message, 500);
  }
};

export const followUser = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const currentUserId = req.user?.userId;

  if (currentUserId === id) {
    return sendError(res, 'You cannot follow yourself', null, 400);
  }

  try {
    const userToFollow = await User.findById(id);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow || !currentUser) {
      return sendError(res, 'User not found', null, 404);
    }

    const isFollowing = currentUser.following.includes(id as any);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(f => f.toString() !== id) as any;
      userToFollow.followers = userToFollow.followers.filter(f => f.toString() !== currentUserId) as any;
      
      // Also remove from friends if they were mutual
      currentUser.friends = currentUser.friends.filter(f => f.toString() !== id) as any;
      userToFollow.friends = userToFollow.friends.filter(f => f.toString() !== currentUserId) as any;
      
      logger.info(`User ${currentUser.username} unfollowed ${userToFollow.username}`);
    } else {
      // Follow
      currentUser.following.push(id as any);
      userToFollow.followers.push(currentUserId as any);

      // If mutual following, add to friends list
      if (userToFollow.following.includes(currentUserId as any)) {
        currentUser.friends.push(id as any);
        userToFollow.friends.push(currentUserId as any);
        logger.info(`User ${currentUser.username} and ${userToFollow.username} became friends`);
      }
      
      logger.info(`User ${currentUser.username} followed ${userToFollow.username}`);
    }

    await currentUser.save();
    await userToFollow.save();

    return sendSuccess(res, isFollowing ? 'Unfollowed successfully' : 'Followed successfully', {
      following: currentUser.following,
      followers: userToFollow.followers,
      isFollowing: !isFollowing,
      isFriend: currentUser.friends.includes(id as any)
    });
  } catch (error: any) {
    return sendError(res, 'Social request failed', error.message, 500);
  }
};

export const buyDiamonds = async (req: AuthenticatedRequest, res: Response) => {
  const { amount } = req.body;
  const currentUserId = req.user?.userId;

  if (!amount || amount <= 0) {
    return sendError(res, 'Invalid diamond amount', null, 400);
  }

  try {
    const user = await User.findById(currentUserId);
    if (!user) return sendError(res, 'User not found', null, 404);

    user.diamonds += amount;
    await user.save();

    logger.info(`User ${user.username} purchased ${amount} diamonds`);
    return sendSuccess(res, 'Diamonds purchased successfully', { diamonds: user.diamonds });
  } catch (error: any) {
    return sendError(res, 'Purchase failed', error.message, 500);
  }
};

export const buyVIP = async (req: AuthenticatedRequest, res: Response) => {
  const { plan } = req.body; // 'VIP' (cost 500) or 'SVIP' (cost 1500)
  const currentUserId = req.user?.userId;

  if (plan !== 'VIP' && plan !== 'SVIP') {
    return sendError(res, 'Invalid VIP plan selection', null, 400);
  }

  const cost = plan === 'VIP' ? 500 : 1500;

  try {
    const user = await User.findById(currentUserId);
    if (!user) return sendError(res, 'User not found', null, 404);

    if (user.diamonds < cost) {
      return sendError(res, `Insufficient diamonds. You need ${cost} diamonds for ${plan}`, null, 400);
    }

    user.diamonds -= cost;
    user.vipLevel = plan;
    await user.save();

    logger.info(`User ${user.username} upgraded to ${plan} membership`);
    return sendSuccess(res, `Successfully upgraded to ${plan}!`, {
      vipLevel: user.vipLevel,
      diamonds: user.diamonds,
    });
  } catch (error: any) {
    return sendError(res, 'Membership upgrade failed', error.message, 500);
  }
};

export const getFriends = async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.userId;
  try {
    const user = await User.findById(currentUserId)
      .populate('friends', 'username avatar bio vipLevel');
    if (!user) return sendError(res, 'User not found', null, 404);
    return sendSuccess(res, 'Friends list retrieved', user.friends);
  } catch (error: any) {
    return sendError(res, 'Failed to fetch friends', error.message, 500);
  }
};
