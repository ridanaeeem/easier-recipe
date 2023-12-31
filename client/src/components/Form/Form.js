import React, { useState } from "react";
import FileBase from "react-file-base64";
import { useDispatch } from "react-redux";
import { createRecipe } from "../../actions/recipes";
import axios from "axios";
import default2 from "../../images/default2.svg";

export function Form() {
	// user info
	const user = JSON.parse(localStorage.getItem("profile"));
	const email = user?.email;

	// set the initial state of the recipe data to be empty strings and the current user's email
	const [recipeData, setRecipeData] = useState({
		title: "",
		description: "",
		ingredients: "",
		instructions: "",
		tags: "",
		creator: String(email),
		url: "",
		image: "",
		prepTime: 0,
		cookTime: 0,
		totalTime: 0,
		yield: 1,
		cuisine: "",
		category: "",
	});

	// so we can dispatch the actions
	const dispatch = useDispatch();

	// when the user clicks the submit button, validate the data before dispatching
	function validate(recipeData) {
		// go through each property in the recipeData object
		for (var prop in recipeData) {
			// maxLength and required is covered by the HTML input fields
			// check for special characters next
			if (Object.prototype.hasOwnProperty.call(recipeData, prop)) {
				if (String(recipeData[prop]).includes("<") || String(recipeData[prop]).includes(">")) {
					alert(`Please enter a valid ${prop}, special characters (<, >, {, }) not allowed`);
					return false;
				} else if (String(recipeData[prop]).includes("{") || String(recipeData[prop]).includes("}")) {
					alert(`Please enter a valid ${prop}, special characters (<, >, {, }) not allowed`);
					return false;
				}
			}
		}
		return true;
	}

	// when the user submits the form, dispatch the action to create the recipe
	const handleSubmit = (e) => {
		// send over post request with the data entered by user
		// so the form doesn't clear when the user submits, in case error checking needs to happen
		e.preventDefault();
		// dispatch action to create the recipe
		console.log("Recipe Data:", recipeData);
		if (validate(recipeData)) {
			dispatch(createRecipe({ ...recipeData }));
		} else {
			console.log("Error");
		}
		// clear the form after recipe data is sent
		handleClear(e);
	};

	// when the user clicks the clear button, clear the form
	const handleClear = (e) => {
		e.preventDefault();
		setRecipeData({
			title: "",
			description: "",
			ingredients: "",
			instructions: "",
			tags: "",
			creator: String(email),
			url: "",
			image: "",
			prepTime: 0,
			cookTime: 0,
			totalTime: 0,
			yield: 1,
			cuisine: "",
			category: "",
		});
	};

	// url stuff
	const [urlInput, setUrlInput] = useState("");

	// api - get recipe from url
	const fetchRecipeFromUrl = async (recipe_url) => {
		const base_url = "https://recipe-scrape.vercel.app/api/scrape?url=";
		const scraperCall = base_url + recipe_url;

		const data = await fetch(scraperCall).then((response) => response.json());
		console.log("first api", data);

		// if the first api doesnt work, try second one
		if (!data.title) {
			console.log("first api did not work! trying second one");

			const options = {
				method: "GET",
				url: "https://cookr-recipe-parser.p.rapidapi.com/getRecipe",
				params: {
					source: recipe_url,
				},
				headers: {
					"X-RapidAPI-Key": process.env.REACT_APP_COOKR_KEY,
					"X-RapidAPI-Host": "cookr-recipe-parser.p.rapidapi.com",
				},
			};

			try {
				const response = await axios.request(options);
				const cookrData = response.data.recipe;
				console.log(cookrData);
				// cleaning up instructions
				const unprocessedCookrInstructions = cookrData.recipeInstructions;
				var processedCookrInstructions = [];
				for (let x in unprocessedCookrInstructions) {
					processedCookrInstructions.push(unprocessedCookrInstructions[x].text);
				}
				// cleaning up tags
				const unprocessedCookrTags = cookrData.recipeTags;
				var processedCookrTags = [];
				for (let x in unprocessedCookrTags) {
					processedCookrTags.push(unprocessedCookrTags[x].name);
				}
				// cleaning up times
				const processedPrep = Number(cookrData.prepTime.split(" ")[0]);
				const processedCook = Number(cookrData.prepTime.split(" ")[0]);
				console.log(processedCookrTags);
				setRecipeData({
					title: cookrData.name,
					description: cookrData.description,
					ingredients: cookrData.recipeIngredients,
					instructions: processedCookrInstructions,
					tags: processedCookrTags,
					creator: String(email),
					url: recipe_url,
					image: cookrData.image ? cookrData.image : default2,
					prepTime: processedPrep,
					cookTime: processedCook,
					totalTime: processedPrep + processedCook,
					yield: cookrData.recipeYield,
					cuisine: cookrData.recipeCuisine,
					category: cookrData.recipeCategory,
				});
				console.log("via cookr: ", recipeData);
			} catch (error) {
				console.error(error);
				console.log("second api did not work either!");
			}
			return;
		}

		// if the first api works, fill out the form accordingly
		// clean up the data first
		var processedCuisine = "";
		if (data.cuisine) {
			processedCuisine = data.cuisine.split(",");
		}
		var processedCategory = "";
		if (data.category) {
			processedCategory = data.category.split(",");
		}
		var processedYield = data.yields;
		const spaceIndex = processedYield.indexOf(" ");
		if (spaceIndex) {
			processedYield = Number(processedYield.substring(0, spaceIndex));
		}
		setRecipeData({
			title: data.title,
			description: data.description,
			ingredients: data.ingredients,
			instructions: data.instructions_list,
			tags: "",
			creator: String(email),
			url: recipe_url,
			image: data.image ? data.image : default2,
			prepTime: data.prep_time,
			cookTime: data.cook_time,
			totalTime: data.total_time,
			yield: processedYield,
			cuisine: processedCuisine,
			category: processedCategory,
		});
		console.log("via api 1: ", recipeData);
	};

	return (
		<>
			<form id="urlForm">
				<input
					id="urlInput"
					type="text"
					value={urlInput}
					onChange={(e) => setUrlInput(e.target.value)}
					placeholder="Enter URL"></input>
				<br></br>
				<button type="button" onClick={() => fetchRecipeFromUrl(urlInput)}>
					Submit URL
				</button>
			</form>

			<form id="recipeForm" onSubmit={handleSubmit}>
				<label>
					Title
					<br></br>
					<input
						id="titleInput"
						type="text"
						value={recipeData.title}
						onChange={(e) => setRecipeData({ ...recipeData, title: e.target.value })}
						required
						maxLength="50"
						form="recipeForm"
					/>
				</label>
				<br></br>
				<label>
					Description
					<br></br>
					<input
						id="descriptionInput"
						value={recipeData.description}
						onChange={(e) => setRecipeData({ ...recipeData, description: e.target.value })}
						required
						maxLength="300"
						form="recipeForm"
					/>
				</label>
				<br></br>
				<label>
					Ingredients
					<br></br>
					<input
						id="ingredientsInput"
						value={recipeData.ingredients}
						onChange={(e) => setRecipeData({ ...recipeData, ingredients: e.target.value })}
						required
						maxLength="50"
						form="recipeForm"
					/>
				</label>
				<br></br>
				<label>
					Instructions
					<br></br>
					<input
						id="instructionsInput"
						value={recipeData.instructions}
						onChange={(e) => setRecipeData({ ...recipeData, instructions: e.target.value })}
						required
						maxLength="1000"
						form="recipeForm"
					/>
				</label>
				<br></br>
				<label>
					Tags
					<br></br>
					<input
						id="tagsInput"
						value={recipeData.tags}
						onChange={(e) => setRecipeData({ ...recipeData, tags: e.target.value })}
						maxLength="20"
					/>
				</label>
				<br></br>
				{/* photo upload currently does not work - table this functionality for now
				<label>Photo Upload
				<br></br>
				<div>
					<FileBase
						id="photoInput"
						type="file"
						multiple={false}
						onDone={(base64) => setRecipeData({ ...recipeData, recipePhoto: base64 })}></FileBase>
				</div> 
				</label> */}
				<button type="submit" id="submit">
					Submit
				</button>
				<button type="button" onClick={handleClear}>
					Clear
				</button>
			</form>
		</>
	);
}

export default Form;
