export default (D) => {
  D.txt('t', 0, -200, 'Who STORES the state, and who USES it', { size: 'xl' })
  D.txt('s', 0, -130, 'Our app at the end of today. Purple = props going DOWN. Orange = a child calling a function its parent gave it.', { size: 'l', color: 'grey', w: 2100 })

  D.box('ps', 650, 0, 800, 280, 'PokeSearch\n\nSTORES:  pokemonName, pokemonList\nUSES:  pokemonName (to search)', { color: 'blue', size: 'l', font: 'mono' })

  D.box('pf', 0, 500, 620, 260, 'PokeForm\n\nSTORES:  nothing\nUSES:  pokemonName\n(the text in the box)', { color: 'grey', size: 'l', font: 'mono' })
  D.box('pc', 1480, 500, 620, 260, 'PokeContainer\n\nSTORES:  nothing\nUSES:  pokemonList\n(one card per pokemon)', { color: 'grey', size: 'l', font: 'mono' })
  D.box('card', 1480, 940, 620, 260, 'PokeCard × n\nkey={pokemon.id}\n\nSTORES:  shiny (its own)\nUSES:  shiny, pokemon', { color: 'green', size: 'l', font: 'mono' })

  D.arrow('d1', 'ps', 'pf', 'pokemonName, setPokemonName,\nhandleSubmit', { color: 'violet', size: 'l' })
  D.arrow('d2', 'ps', 'pc', 'pokemonList, rmData', { color: 'violet', size: 'l' })
  D.arrow('d3', 'pc', 'card', 'pokemon, rmData', { color: 'violet', size: 'l' })

  D.arrow('u1', 'pf', 'ps', 'typing: setPokemonName(text)\nsubmit: handleSubmit(event)', { color: 'orange', dash: 'dashed', size: 'l', bend: -260 })
  D.arrow('u2', 'card', 'ps', 'Remove: rmData(pokemon.id)', { color: 'orange', dash: 'dashed', size: 'l', bend: -220 })
  D.box('rule', 0, 940, 1100, 260, 'STORES = has the useState\nUSES = reads the value\n(from its own state, or from a prop)', { color: 'yellow', size: 'l' })
}
