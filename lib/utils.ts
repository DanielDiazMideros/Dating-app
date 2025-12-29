export const calculateAge = (birthdate: string) => {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

type Rule = {
  test: (d: { hours: number; days: number }) => boolean;
  format: (date: Date) => string;
};

export const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const hours = Math.floor(diffMs / 36e5);
  const days = Math.floor(hours / 24);

  const rules: Rule[] = [
    { test: ({ hours }) => hours < 1, format: () => "Just now" },
    {
      test: ({ hours }) => hours < 24,
      format: (date) =>
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
    { test: ({ days }) => days === 1, format: () => "Yesterday" },
    { test: () => true, format: (date) => date.toLocaleDateString() },
  ];

  return rules.find((r) => r.test({ hours, days }))!.format(date);
};
