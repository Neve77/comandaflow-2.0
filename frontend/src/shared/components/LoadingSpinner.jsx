export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-14 w-14 rounded-full border-4 border-brand-600 border-t-transparent animate-spin" />
    </div>
  );
}
