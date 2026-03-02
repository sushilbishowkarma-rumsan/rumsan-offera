import * as React from 'react'

import { cn } from '@/lib/utils'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className,
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-6', className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}


// import * as React from 'react'

// import { cn } from '@/lib/utils'

// function Card({ className, ...props }: React.ComponentProps<'div'>) {
//   return (
//     <div
//       data-slot="card"
//       className={cn(
//         'flex flex-col gap-6 rounded-2xl py-6 shadow-sm',
//         className,
//       )}
//       style={{
//         background: 'rgba(255,255,255,0.02)',
//         border: '1px solid rgba(255,255,255,0.06)',
//         boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
//       }}
//       {...props}
//     />
//   )
// }

// function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
//   return (
//     <div
//       data-slot="card-header"
//       className={cn(
//         '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
//         className,
//       )}
//       {...props}
//     />
//   )
// }

// function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
//   return (
//     <div
//       data-slot="card-title"
//       className={cn('leading-none font-semibold text-slate-100', className)}
//       {...props}
//     />
//   )
// }

// function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
//   return (
//     <div
//       data-slot="card-description"
//       className={cn('text-sm text-slate-500', className)}
//       {...props}
//     />
//   )
// }

// function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
//   return (
//     <div
//       data-slot="card-action"
//       className={cn(
//         'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
//         className,
//       )}
//       {...props}
//     />
//   )
// }

// function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
//   return (
//     <div
//       data-slot="card-content"
//       className={cn('px-6', className)}
//       {...props}
//     />
//   )
// }

// function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
//   return (
//     <div
//       data-slot="card-footer"
//       className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
//       {...props}
//     />
//   )
// }

// export {
//   Card,
//   CardHeader,
//   CardFooter,
//   CardTitle,
//   CardAction,
//   CardDescription,
//   CardContent,
// }