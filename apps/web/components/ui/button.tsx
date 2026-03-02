import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

// import * as React from 'react'
// import { Slot } from '@radix-ui/react-slot'
// import { cva, type VariantProps } from 'class-variance-authority'

// import { cn } from '@/lib/utils'

// const buttonVariants = cva(
//   "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none active:scale-95",
//   {
//     variants: {
//       variant: {
//         default:
//           'text-white hover:opacity-90',
//         destructive:
//           'text-rose-400 hover:opacity-90',
//         outline:
//           'text-slate-400 hover:text-slate-200',
//         secondary:
//           'text-slate-300 hover:text-white',
//         ghost:
//           'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]',
//         link:
//           'text-indigo-400 underline-offset-4 hover:underline',
//       },
//       size: {
//         default: 'h-9 px-4 py-2 has-[>svg]:px-3',
//         sm: 'h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5 text-xs',
//         lg: 'h-10 rounded-xl px-6 has-[>svg]:px-4',
//         icon: 'size-9',
//         'icon-sm': 'size-8',
//         'icon-lg': 'size-10',
//       },
//     },
//     defaultVariants: {
//       variant: 'default',
//       size: 'default',
//     },
//   },
// )

// // Inline styles per variant (can't express rgba in Tailwind without config)
// const variantStyles: Record<string, React.CSSProperties> = {
//   default: {
//     background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
//     boxShadow: '0 4px 16px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
//   },
//   destructive: {
//     background: 'rgba(239,68,68,0.1)',
//     border: '1px solid rgba(239,68,68,0.2)',
//   },
//   outline: {
//     background: 'rgba(255,255,255,0.03)',
//     border: '1px solid rgba(255,255,255,0.1)',
//   },
//   secondary: {
//     background: 'rgba(255,255,255,0.06)',
//     border: '1px solid rgba(255,255,255,0.08)',
//   },
//   ghost: {},
//   link: {},
// }

// function Button({
//   className,
//   variant = 'default',
//   size,
//   asChild = false,
//   style,
//   ...props
// }: React.ComponentProps<'button'> &
//   VariantProps<typeof buttonVariants> & {
//     asChild?: boolean
//   }) {
//   const Comp = asChild ? Slot : 'button'
//   const resolvedVariant = (variant ?? 'default') as string

//   return (
//     <Comp
//       data-slot="button"
//       className={cn(buttonVariants({ variant, size, className }))}
//       style={{ ...variantStyles[resolvedVariant], ...style }}
//       {...props}
//     />
//   )
// }

// export { Button, buttonVariants }