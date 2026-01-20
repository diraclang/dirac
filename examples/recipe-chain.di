<!-- Recipe Generator - Chained LLM calls -->
<dirac>
  <defvar name="ingredients" value="chicken, rice, tomatoes, garlic" />
  
  <output>Available ingredients: ${ingredients}&#10;&#10;</output>
  
  <!-- Step 1: Generate a dish name -->
  <output>Step 1: Coming up with a dish...&#10;</output>
  <LLM output="dishName" maxTokens="50">
    Given these ingredients: ${ingredients}
    Suggest ONE dish name (just the name, nothing else).
  </LLM>
  <output>Dish: ${dishName}&#10;&#10;</output>
  
  <!-- Step 2: Create the recipe using the dish name -->
  <output>Step 2: Creating recipe for ${dishName}...&#10;</output>
  <LLM output="recipe" maxTokens="400">
    Create a simple recipe for "${dishName}" using: ${ingredients}
    
    Format:
    Ingredients:
    - list items
    
    Instructions:
    1. numbered steps
    
    Keep it brief and practical.
  </LLM>
  <output>&#10;${recipe}&#10;&#10;</output>
  
  <!-- Step 3: Estimate cooking time -->
  <output>Step 3: Estimating time...&#10;</output>
  <LLM output="cookTime" maxTokens="50" context="recipe">
    Based on this recipe, what's the total cooking time?
    Answer with just a number and unit (e.g., "45 minutes").
  </LLM>
  <output>Total time: ${cookTime}&#10;</output>
</dirac>
