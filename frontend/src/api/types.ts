export type Role = "ADMIN" | "USER";

export type User = {
  id: number;
  email: string;
  role: Role;
  level: number;
  xp: number;
  wins: number;
  losses: number;
};

export type AuthResponse = {
  user: User;
  token: string;
};

export type Character = {
  id: number;
  name: string;
  maxHp: number;
  hp: number;
  attack: number;
  requiredLevel: number;
};

export type CreateBattleMode = "PVE" | "PVP";

export type BattleState = {
  id: number;
  mode: CreateBattleMode;
  status: "ACTIVE" | "FINISHED";
  currentTurnSide: "INITIATOR" | "OPPONENT";
  winnerUserId: number | null;
  winnerSide: "INITIATOR" | "OPPONENT" | null;
  initiator: null | {
    userId: number | null;
    character: { id: number; name: string; hp: number; maxHp: number; attack: number };
    specialUsed: boolean;
  };
  opponent: null | {
    userId: number | null;
    character: { id: number; name: string; hp: number; maxHp: number; attack: number };
    specialUsed: boolean;
  };
};

export type BattleAttackEvent = {
  battleId: number;
  attackerSide: "INITIATOR" | "OPPONENT";
  attackerCharacterId: number;
  targetSide: "INITIATOR" | "OPPONENT";
  targetCharacterId: number;
  damage: number;
  targetHp: number;
  special: boolean;
};

// ===== admin =====
export type CreateUserDto = {
  email: string;
  passwordHash: string;
  role?: Role;
};

export type UpdateUserDto = Partial<CreateUserDto>;