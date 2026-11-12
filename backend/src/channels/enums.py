from enum import Enum


class ChannelType(str, Enum):
    OFFICIAL = "OFFICIAL"
    GROUP = "GROUP"


class ChannelRole(str, Enum):
    OWNER = "OWNER"
    MODERATOR = "MODERATOR"
    MEMBER = "MEMBER"