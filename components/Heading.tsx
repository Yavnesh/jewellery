// *********************
// Role of the component: Simple H2 heading component
// Name of the component: Heading.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <Heading title={title} />
// Input parameters: { title: string }
// Output: h2 heading title with some styles 
// *********************

import React from 'react'

const Heading = ({ title } : { title: string }) => {
  return (
    <h2 className="text-luxury-text-primary text-4xl font-serif font-light text-center tracking-widest uppercase my-10 max-lg:text-3xl">{ title }</h2>
  )
}

export default Heading