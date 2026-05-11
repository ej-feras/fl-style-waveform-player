import * as React from 'react'
import * as TogglePrimitive from '@radix-ui/react-toggle'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const toggleVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-daw-light hover:text-daw-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-daw-green disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-daw-green/20 data-[state=on]:text-daw-green',
  {
    variants: {
      variant: {
        default: 'bg-transparent text-daw-text-dim',
        outline: 'border border-daw-border bg-transparent text-daw-text-dim',
      },
      size: {
        default: 'h-9 px-3',
        sm: 'h-7 px-2',
        icon: 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const Toggle = React.forwardRef<
  React.ComponentRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle }
