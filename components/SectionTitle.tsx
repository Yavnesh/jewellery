// *********************
// Role of the component: Section title that can be used on any page
// Name of the component: SectionTitle.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <SectionTitle />
// Input parameters: {title: string; path: string}
// Output: div containing h1 for page title and p for page location path 
// *********************

import React from 'react'

const SectionTitle = ({title, path} : {title: string; path: string}) => {
  return (
    <div className='h-[200px] border-b pt-12 border-luxury-border/60 bg-luxury-ivory mb-2 max-sm:h-[160px] max-sm:pt-10 flex flex-col justify-center items-center'>
        <h1 className='section-title-title text-4xl text-center mb-3 max-md:text-3xl max-sm:text-2xl text-luxury-text-primary font-serif font-light uppercase tracking-wider'>{ title }</h1>
        <p className='section-title-path text-xs text-center max-sm:text-[11px] text-luxury-text-secondary uppercase tracking-widest font-sans'>{ path }</p>
    </div>
  )
}

export default SectionTitle