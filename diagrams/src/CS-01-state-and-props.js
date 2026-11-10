export default (D) => {
  D.txt('t', 0, -200, 'State lives where it is needed. Props carry it down.', { size: 'xl' })
  D.txt('s', 0, -130, 'Our app at the end of today. Purple = props going DOWN. Orange = a child calling a function its parent gave it.', { size: 'l', color: 'grey', w: 2100 })

  D.box('ps', 650, 0, 800, 230, 'PokeSearch\n\nSTATE:  pokemonName, pokemonList\nFUNCTIONS:  handleSubmit, rmData', { color: 'blue', size: 'l', font: 'mono' })

  D.box('pf', 0, 440, 620, 190, 'PokeForm\n\nno state: shows the box', { color: 'grey', size: 'l', font: 'mono' })
  D.box('pc', 1480, 440, 620, 190, 'PokeContainer\n\nno state: one card per pokemon', { color: 'grey', size: 'l', font: 'mono' })
  D.box('card', 1480, 820, 620, 220, 'PokeCard × n\nkey={pokemon.id}\n\nSTATE:  shiny\n(each card its own)', { color: 'green', size: 'l', font: 'mono' })

  D.arrow('d1', 'ps', 'pf', 'pokemonName, setPokemonName,\nhandleSubmit', { color: 'violet', size: 'l' })
  D.arrow('d2', 'ps', 'pc', 'pokemonList, rmData', { color: 'violet', size: 'l' })
  D.arrow('d3', 'pc', 'card', 'pokemon, rmData', { color: 'violet', size: 'l' })

  D.arrow('u1', 'pf', 'ps', 'typing: setPokemonName(text)\nsubmit: handleSubmit(event)', { color: 'orange', dash: 'dashed', size: 'l', bend: -200 })
  D.arrow('u2', 'card', 'ps', 'Remove: rmData(pokemon.id)', { color: 'orange', dash: 'dashed', size: 'l', bend: -220 })
  D.box('rule', 0, 840, 1100, 200, 'RULE: state goes in the lowest\ncomponent that needs it.\nthe list (shared) → PokeSearch\nshiny (one card) → that card', { color: 'yellow', size: 'l' })
}
