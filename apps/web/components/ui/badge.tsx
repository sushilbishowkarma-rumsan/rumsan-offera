import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
// import * as React from 'react'
// import { Slot } from '@radix-ui/react-slot'
// import { cva, type VariantProps } from 'class-variance-authority'

// import { cn } from '@/lib/utils'

// const badgeVariants = cva(
//   'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:ring-2 transition-all overflow-hidden',
//   {
//     variants: {
//       variant: {
//         default:
//           'border-transparent text-white',
//         secondary:
//           'text-slate-300',
//         destructive:
//           'text-rose-400',
//         outline:
//           'text-slate-300',
//       },
//     },
//     defaultVariants: {
//       variant: 'default',
//     },
//   },
// )

// function Badge({
//   className,
//   variant,
//   asChild = false,
//   style,
//   ...props
// }: React.ComponentProps<'span'> &
//   VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
//   const Comp = asChild ? Slot : 'span'

//   // Apply default dark theme styles based on variant
//   const variantStyles: React.CSSProperties =
//     variant === 'destructive'
//       ? { background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', color: '#f87171' }
//       : variant === 'secondary'
//       ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }
//       : variant === 'outline'
//       ? { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }
//       : { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: '#fff' }

//   return (
//     <Comp
//       data-slot="badge"
//       className={cn(badgeVariants({ variant }), className)}
//       style={{ ...variantStyles, ...style }}
//       {...props}
//     />
//   )
// }

// export { Badge, badgeVariants }