export const Loading = ({
  complementaryText,
}: {
  complementaryText?: string;
}) => {
  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">{`Loading ${complementaryText}...`}</p>
    </div>
  );
};
