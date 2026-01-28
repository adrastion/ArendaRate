'use client'

interface AddReviewButtonProps {
  onClick: () => void
}

export function AddReviewButton({ onClick }: AddReviewButtonProps) {
  return (
    <button
      onClick={onClick}
      className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-3 md:px-6 md:py-3 rounded-lg shadow-lg font-medium flex items-center justify-center space-x-0 md:space-x-2 transition-colors w-12 h-12 md:w-auto md:h-auto"
      aria-label="Добавить отзыв"
    >
      <svg
        className="w-6 h-6 md:w-5 md:h-5"
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
      <span className="hidden md:inline">Добавить отзыв</span>
    </button>
  )
}

