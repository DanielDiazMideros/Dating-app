type Gender = "male" | "female" | "other";

export type ProfileFormValues = {
  full_name: string;
  username: string;
  bio: string;
  gender: Gender;
  birthdate: string;
  avatar_url: string;
};
