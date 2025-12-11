'use client'

interface AddReviewButtonProps {
  onClick: () => void
}

export function AddReviewButton({ onClick }: AddReviewButtonProps) {
  return (
    <button
      onClick={onClick}
      className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg shadow-lg font-medium flex items-center space-x-2 transition-colors"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
      <span>Добавить отзыв</span>
    </button>
  )
}

