'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'

export default function AboutPage() {
  const [isEmailCopied, setIsEmailCopied] = useState(false)

  const handleCopyEmail = () => {
    const email = 'ArendaRate@yandex.ru'
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(email).then(() => {
        setIsEmailCopied(true)
        setTimeout(() => setIsEmailCopied(false), 2000)
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <section className="mb-10">
              <div className="text-center mb-8">
                <div className="text-4xl md:text-5xl font-extrabold tracking-wide text-gray-900 dark:text-white mb-3">
                  <span className="text-gray-900 dark:text-white">Arenda</span>
                  <span className="text-primary-600 dark:text-primary-400">Rate</span>
                </div>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Устав компании ArendaRate
                </p>
                <p className="mt-4 text-sm md:text-base italic text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                  Девиз компании:{' '}
                  <span className="font-semibold">
                    ArendaRate - твой опыт, это чья-то безопасность. Честная аренда начинается здесь.
                  </span>
                </p>
              </div>

              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Мы, создатели ArendaRate, осознавая свою ответственность перед каждым человеком, который ищет не просто квартиру, а место, где хочется жить - с комфортом, в безопасности и с доверием, - провозглашаем эту Конституцию основой нашей миссии.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Наша платформа даёт арендаторам возможность честно и свободно делиться своим опытом проживания в съёмном жилье, формируя таким образом открытую и справедливую среду для всех.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                С помощью отзывов и объективных оценок в виде звёздочек пользователи могут выразить своё мнение по следующим важнейшим аспектам аренды:
              </p>
              <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4 mb-4">
                <li>Чистота в квартире и общее состояние жилья.</li>
                <li>Состояние кухни, ванной комнаты и туалета.</li>
                <li>Уровень шума в доме и за окном.</li>
                <li>Поведение и адекватность соседей (в том числе наличие асоциальных или опасных элементов)</li>
                <li>Развитая инфраструктура: наличие поблизости парков, магазинов, школ, детских садов, поликлиник, торговых центров, спортивных объектов.</li>
                <li>Транспортная доступность: близость остановок общественного транспорта, метро и дорожной сети.</li>
              </ol>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                Мы верим, что каждый человек, прочитав правдивый отзыв, получает право сделать более осознанный и безопасный выбор. Потому что правда - это тот редкий ресурс, который не теряет своей силы, даже если о нём говорят тихо.
              </p>

              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Раздел I. Основные принципы</h2>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Статья 1. Честность и прозрачность</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                ArendaRate основана на идее открытого диалога и достоверности. Мы предоставляем арендаторам площадку, где личный опыт становится ценным ориентиром для других. Правда о вашем вчерашнем дне помогает кому-то в завтрашнем.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Статья 2. Безопасность - основа достойной жизни</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Для нас безопасность - это не просто функция сервиса, а суть нашей миссии. Мы стремимся создать цифровую экосистему, в которой каждый человек может обезопасить себя от нежелательного жилья, недобросовестных арендодателей и неблагоприятной обстановки. Когда речь идёт о благополучии, нет второстепенных деталей. Чистый подъезд, тихий сосед, освещение рядом с остановкой - всё это и есть безопасность.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Статья 3. Свобода слова с ответственностью</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                Ваше мнение имеет значение - всегда!  Мы поддерживаем свободу самовыражения в рамках честности, корректности и уважения. Отзывы должны быть правдивыми и основанными на личном опыте. Без фальсификаций, без клеветы - только добросовестная правда.
              </p>

              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Раздел II. Права пользователей</h2>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Статья 4. Право на публикацию</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Каждый зарегистрированный пользователь, проживавший в арендуемом жилье, имеет возможность написать отзыв, выставить оценки и поделиться своими личными наблюдениями. ArendaRate способствует тому, чтобы голос арендатора был услышан - качественно, быстро и корректно.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Статья 5. Право на защиту информации</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                На данном этапе платформа принимает и публикует только отзывы арендаторов. Мы обязуемся проверять отзывы на предмет злоупотреблений и нарушений этических норм, сохраняя честность в каждой публикации. У всех пользователей будет возможность сообщать о подозрительных отзывах для повторной проверки.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Статья 6. Право на доступ к истории</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                Каждый желающий может ознакомиться с ранее оставленными отзывами о конкретном жилье, районе или объекте аренды. Мы создаем карту реального опыта аренды, которая призвана предупреждать, вдохновлять и защищать.
              </p>

              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Раздел III. Социальная миссия</h2>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Статья 7. Профилактика через правду</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Если отзыв содержит информацию о потенциальных рисках для жизни, здоровья или эмоционального состояния будущих жильцов (например, агрессивные соседи, дом с многочисленными нарушениями, антисанитария и т. д.), мы обязуемся помечать такие отзывы как «особо важные», чтобы привлечь внимание всех читателей. Такая система сама по себе становится механизмом раннего предупреждения. ArendaRate - это цифровой щит, активируемый словом.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Статья 8. Безопасность - бесплатно</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Функции, связанные с оценкой условий проживания, безопасности и жизненной среды, всегда будут доступны для бесплатного просмотра. Мы считаем, что каждый имеет право знать, что его ждёт за дверью арендованного жилья.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Статья 9. Просвещение и поддержка</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                Мы информируем пользователей о правах арендаторов, о том, как распознать недобросовестную сделку, а также о важных аспектах взаимодействия с собственниками и управляющими компаниями. ArendaRate - это не только приложение, но и инструмент для обучения безопасному проживанию в арендованном жилье.
              </p>

              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Заключение</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Эта Конституция - наш моральный и деловой ориентир. Мы создаём не просто информационное пространство, а силу, способную менять человеческие судьбы.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Один честный отзыв, одна звезда, поставленная от всего сердца, могут уберечь других от неверных решений.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Пожалуйста расскажите правду о своём опыте проживания - и, возможно, вы сохраните чью-то уверенность, время, душевный покой, здоровье или даже жизнь.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                Мы все вместе создаём доверие там, где раньше был только риск.
              </p>
              <p className="font-medium text-gray-800 dark:text-gray-200">С уважением, команда ArendaRate.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Контакты и поддержка</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Если у вас есть вопросы, предложения или вы хотите сообщить о проблеме — свяжитесь с нами удобным способом:
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="group flex w-full items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/40 p-4 hover:bg-white dark:hover:bg-gray-800 transition-colors text-left"
                  onClick={handleCopyEmail}
                >
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16v12H4V6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m4 7 8 6 8-6" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">Почта поддержки и предложений</div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 break-words">
                      ArendaRate@yandex.ru
                    </div>
                    <div className="mt-2 text-sm text-primary-600 dark:text-primary-400 group-hover:underline">
                      {isEmailCopied ? 'Почта скопирована' : 'Скопировать почту →'}
                    </div>
                  </div>
                </button>

                <a
                  className="group flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/40 p-4 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  href="https://t.me/ArendaRateTS"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13l8-6-3 10-2-3-3-1Z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">Техподдержка в Telegram</div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 break-words">t.me/ArendaRateTS</div>
                    <div className="mt-2 text-sm text-sky-700 dark:text-sky-300 group-hover:underline">
                      Открыть чат →
                    </div>
                  </div>
                </a>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <a
                  className="group flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/40 p-4 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  href="https://t.me/ArendaRate"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13l8-6-3 10-2-3-3-1Z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">Новостной Telegram-канал</div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 break-words">t.me/ArendaRate</div>
                    <div className="mt-2 text-sm text-sky-700 dark:text-sky-300 group-hover:underline">
                      Перейти в канал →
                    </div>
                  </div>
                </a>

                <a
                  className="group flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/40 p-4 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  href="https://vk.com/club235637206"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13l8-6-3 10-2-3-3-1Z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      Группа во ВКонтакте
                    </div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 break-words">
                      vk.com/club235637206
                    </div>
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 group-hover:underline">
                      Открыть сообщество →
                    </div>
                  </div>
                </a>
              </div>
            </section>

            <section className="border-t dark:border-gray-700 pt-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Поддержать проект</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                ArendaRate — это независимый проект, созданный для помощи людям. 
                Если вы хотите поддержать развитие платформы, вы можете сделать это через:
              </p>
              <a
                href="https://yoomoney.ru/to/4100119446457843"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white px-6 py-3 rounded-md font-medium transition-colors"
              >
                Сказать спасибо
              </a>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
