var documenterSearchIndex = {"docs":
[{"location":"#StructTypes.jl","page":"Home","title":"StructTypes.jl","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"This guide provides documentation around the StructTypes.StructType trait for Julia objects and its associated functions. This package was born from a desire to make working with, and especially constructing, Julia objects more programmatic and customizable. This allows powerful workflows when doing generic object transformations and serialization.","category":"page"},{"location":"","page":"Home","title":"Home","text":"If anything isn't clear or you find bugs, don't hesitate to open a new issue, even just for a question, or come chat with us on the #data slack channel with questions, concerns, or clarifications.","category":"page"},{"location":"","page":"Home","title":"Home","text":"Depth = 3","category":"page"},{"location":"#StructTypes.StructType","page":"Home","title":"StructTypes.StructType","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"In general, custom Julia types tend to be one of: 1) \"data types\", 2) \"interface types\" or sometimes 3) \"abstract types\" with a known set of concrete subtypes. Data types tend to be \"collection of fields\" kind of types; fields are generally public and directly accessible, they might also be made to model \"objects\" in the object-oriented sense. In any case, the type is \"nominal\" in the sense that it's \"made up\" of the fields it has, sometimes even if just for making it more convenient to pass them around together in functions.","category":"page"},{"location":"","page":"Home","title":"Home","text":"Interface types, on the other hand, are characterized by private fields; they contain optimized representations \"under the hood\" to provide various features/functionality and are useful via interface methods implemented: iteration, getindex, accessor methods, etc. Many package-provided libraries or Base-provided structures are like this: Dict, Array, Socket, etc. For these types, their underlying fields are mostly cryptic and provide little value to users directly, and are often explictly documented as being implementation details and not to be accessed under warning of breakage.","category":"page"},{"location":"","page":"Home","title":"Home","text":"What does all this have to do with the StructTypes.StructType trait? A lot! There's often a desire to programmatically access the \"public\" names and values of an object, whether it's a data, interface, or abstract type. For data types, this means each direct field name and value. For interface types, this means having an API to get the names and values (ignoring direct fields). Similarly for programmatic construction, we need to specify how to construct the Julia structure given an arbitrary set of key-value pairs.","category":"page"},{"location":"","page":"Home","title":"Home","text":"For abstract types, it can be useful to \"bundle\" the behavior of concrete subtypes under a single abstract type; and when serializing/deserializing, an extra key-value pair is added to encode the true concrete type.","category":"page"},{"location":"","page":"Home","title":"Home","text":"Each of these 3 kinds of struct type categories will be now be detailed.","category":"page"},{"location":"#DataTypes","page":"Home","title":"DataTypes","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"You'll remember that \"data types\" are Julia structs that are \"made up\" of their fields. In the object-oriented world, this would be characterized by marking a field as public. A quick example is:","category":"page"},{"location":"","page":"Home","title":"Home","text":"struct Vehicle\n    make::String\n    model::String\n    year::Int\nend","category":"page"},{"location":"","page":"Home","title":"Home","text":"In this case, our Vehicle type is entirely \"made up\" by its fields, make, model, and year.","category":"page"},{"location":"","page":"Home","title":"Home","text":"There are two ways to define the StructTypes.StructType of these kinds of objects:","category":"page"},{"location":"","page":"Home","title":"Home","text":"StructTypes.StructType(::Type{MyType}) = StructTypes.Struct()\n# or\nStructTypes.StructType(::Type{MyType}) = StructTypes.Mutable()","category":"page"},{"location":"#StructTypes.Struct","page":"Home","title":"StructTypes.Struct","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"StructTypes.Struct","category":"page"},{"location":"#StructTypes.Struct","page":"Home","title":"StructTypes.Struct","text":"StructTypes.StructType(::Type{T}) = StructTypes.Struct()\n\nSignal that T can participate in a simplified, performant struct serialization by relying on reliable field order when serializing/deserializing. In particular, when deserializing, parsed input fields are passed directly, in input order to the T constructor, like T(field1, field2, field3). This means that any field names are ignored when deserializing; fields are directly passed to T in the order they're encountered.\n\nFor example, for reading a StructTypes.Struct() from a JSON string input, each key-value pair is read in the order it is encountered in the JSON input, the keys are ignored, and the values are directly passed to the type at the end of the object parsing like T(val1, val2, val3). Yes, the JSON specification says that Objects are specifically un-ordered collections of key-value pairs, but the truth is that many JSON libraries provide ways to maintain JSON Object key-value pair order when reading/writing. Because of the minimal processing done while parsing, and the \"trusting\" that the Julia type constructor will be able to handle fields being present, missing, or even extra fields that should be ignored, this is the fastest possible method for mapping a JSON input to a Julia structure. If your workflow interacts with non-Julia APIs for sending/receiving JSON, you should take care to test and confirm the use of StructTypes.Struct() in the cases mentioned above: what if a field is missing when parsing? what if the key-value pairs are out of order? what if there extra fields get included that weren't anticipated? If your workflow is questionable on these points, or it would be too difficult to account for these scenarios in your type constructor, it would be better to consider the StructTypes.Mutable() option.\n\nstruct CoolType\n    val1::Int\n    val2::Int\n    val3::String\nend\n\nStructTypes.StructType(::Type{CoolType}) = StructTypes.Struct()\n\n# JSON3 package as example\n@assert JSON3.read(\"{\"val1\": 1, \"val2\": 2, \"val3\": 3}\", CoolType) == CoolType(1, 2, \"3\")\n# note how `val2` field is first, then `val1`, but fields are passed *in-order* to `CoolType` constructor; BE CAREFUL!\n@assert JSON3.read(\"{\"val2\": 2, \"val1\": 1, \"val3\": 3}\", CoolType) == CoolType(2, 1, \"3\")\n\n\n\n\n\n","category":"type"},{"location":"#StructTypes.Mutable","page":"Home","title":"StructTypes.Mutable","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"StructTypes.Mutable","category":"page"},{"location":"#StructTypes.Mutable","page":"Home","title":"StructTypes.Mutable","text":"StructTypes.StructType(::Type{T}) = StructTypes.Mutable()\n\nSignal that T is a mutable struct with an empty constructor for serializing/deserializing. Though slightly less performant than StructTypes.Struct, Mutable is a much more robust method for mapping Julia struct fields for serialization. This technique requires your Julia type to be defined, at a minimum, like:\n\nmutable struct T\n    field1\n    field2\n    field3\n    # etc.\n\n    T() = new()\nend\n\nNote specifically that we're defining a mutable struct to allow field mutation, and providing a T() = new() inner constructor which constructs an \"empty\" T where isbitstype fields will be randomly initialized, and reference fields will be #undef. (Note that the inner constructor doesn't need to be exactly this, but at least needs to be callable like T(). If certain fields need to be intialized or zeroed out for security, then this should be accounted for in the inner constructor). For these mutable types, the type will first be initizlied like T(), then serialization will take each key-value input pair, setting the field as the key is encountered, and converting the value to the appropriate field value. This flow has the nice properties of: allowing object construction success even if fields are missing in the input, and if \"extra\" fields exist in the input that aren't apart of the Julia struct's fields, they will automatically be ignored. This allows for maximum robustness when mapping Julia types to arbitrary data foramts that may be generated via web services, databases, other language libraries, etc.\n\nThere are a few additional helper methods that can be utilized by StructTypes.Mutable() types to hand-tune field reading/writing behavior:\n\nStructTypes.names(::Type{T}) = ((:juliafield1, :serializedfield1), (:juliafield2, :serializedfield2)): provides a mapping of Julia field name to expected serialized object key name. This affects both serializing and deserializing. When deserializing the serializedfield1 key, the juliafield1 field of T will be set. When serializing the juliafield2 field of T, the output key will be serializedfield2. Field name mappings are provided as a Tuple of Tuple{Symbol, Symbol}s, i.e. each field mapping is a Julia field name Symbol (first) and serialized field name Symbol (second).\nStructTypes.excludes(::Type{T}) = (:field1, :field2): specify fields of T to ignore when serializing and deserializing, provided as a Tuple of Symbols. When deserializing, if field1 is encountered as an input key, it's value will be read, but the field will not be set in T. When serializing, field1 will be skipped when serializing out T fields as key-value pairs.\nStructTypes.omitempties(::Type{T}) = (:field1, :field2): specify fields of T that shouldn't be serialized if they are \"empty\", provided as a Tuple of Symbols. This only affects serializing. If a field is a collection (AbstractDict, AbstractArray, etc.) and isempty(x) === true, then it will not be serialized. If a field is #undef, it will not be serialized. If a field is nothing, it will not be serialized. To apply this to all fields of T, set StructTypes.omitempties(::Type{T}) = true. You can customize this behavior. For example, by default, missing is not considered to be \"empty\". If you want missing to be considered \"empty\" when serializing your type MyType, simply define:\n\n@inline StructTypes.isempty(::Type{T}, ::Missing) where {T <: MyType} = true\n\nStructTypes.keywordargs(::Type{T}) = (field1=(dateformat=dateformat\"mm/dd/yyyy\",), field2=(dateformat=dateformat\"HH MM SS\",)): provide keyword arguments for fields of type T that should be passed to functions that set values for this field. Define StructTypes.keywordargs as a NamedTuple of NamedTuples.\n\n\n\n\n\n","category":"type"},{"location":"","page":"Home","title":"Home","text":"Support functions for StructTypes.Mutable:","category":"page"},{"location":"","page":"Home","title":"Home","text":"StructTypes.names\nStructTypes.excludes\nStructTypes.omitempties\nStructTypes.keywordargs\nStructTypes.idproperty\nStructTypes.fieldprefix","category":"page"},{"location":"#StructTypes.names","page":"Home","title":"StructTypes.names","text":"StructTypes.names(::Type{T}) = ((:juliafield1, :serializedfield1), (:juliafield2, :serializedfield2))\n\nProvides a mapping of Julia field name to expected serialized object key name. This affects both reading and writing. When reading the serializedfield1 key, the juliafield1 field of T will be set. When writing the juliafield2 field of T, the output key will be serializedfield2.\n\n\n\n\n\n","category":"function"},{"location":"#StructTypes.excludes","page":"Home","title":"StructTypes.excludes","text":"StructTypes.excludes(::Type{T}) = (:field1, :field2)\n\nSpecify for a StructTypes.Mutable StructType the fields, given as a Tuple of Symbols, that should be ignored when deserializing, and excluded from serializing.\n\n\n\n\n\n","category":"function"},{"location":"#StructTypes.omitempties","page":"Home","title":"StructTypes.omitempties","text":"StructTypes.omitempties(::Type{T}) = (:field1, :field2)\nStructTypes.omitempties(::Type{T}) = true\n\nSpecify for a StructTypes.Mutable StructType the fields, given as a Tuple of Symbols, that should not be serialized if they're considered \"empty\".\n\nIf a field is a collection (AbstractDict, AbstractArray, etc.) and isempty(x) === true, then it will not be serialized. If a field is #undef, it will not be serialized. If a field is nothing, it will not be serialized. To apply this to all fields of T, set StructTypes.omitempties(::Type{T}) = true. You can customize this behavior. For example, by default, missing is not considered to be \"empty\". If you want missing to be considered \"empty\" when serializing your type MyType, simply define:\n\n@inline StructTypes.isempty(::Type{T}, ::Missing) where {T <: MyType} = true\n\n\n\n\n\n","category":"function"},{"location":"#StructTypes.keywordargs","page":"Home","title":"StructTypes.keywordargs","text":"StructTypes.keywordargs(::Type{MyType}) = (field1=(dateformat=dateformat\"mm/dd/yyyy\",), field2=(dateformat=dateformat\"HH MM SS\",))\n\nSpecify for a StructTypes.Mutable the keyword arguments by field, given as a NamedTuple of NamedTuples, that should be passed to the StructTypes.construct method when deserializing MyType. This essentially allows defining specific keyword arguments you'd like to be passed for each field in your struct. Note that keyword arguments can be passed when reading, like JSON3.read(source, MyType; dateformat=...) and they will be passed down to each StructTypes.construct method. StructTypes.keywordargs just allows the defining of specific keyword arguments per field.\n\n\n\n\n\n","category":"function"},{"location":"#StructTypes.idproperty","page":"Home","title":"StructTypes.idproperty","text":"StructTypes.idproperty(::Type{MyType}) = :id\n\nSpecify which field of a type uniquely identifies it. The unique identifier field name is given as a Symbol. Useful in database applications where the id field can be used to distinguish separate objects.\n\n\n\n\n\n","category":"function"},{"location":"#StructTypes.fieldprefix","page":"Home","title":"StructTypes.fieldprefix","text":"StructTypes.fieldprefix(::Type{MyType}, field::Symbol) = :field_\n\nWhen interacting with database tables and other strictly 2D data formats, objects with aggregate fields must be flattened into a single set of column names. When deserializing a set of columns into an object with aggregate fields, a field type's fieldprefix signals that column names beginning with, in the example above, :field_, should be collected together when constructing the field field of MyType. Note the default definition is StructTypes.fieldprefix(T, nm) = Symbol(nm, :_).\n\nHere's a more concrete, albeit contrived, example:\n\nstruct Spouse\n    id::Int\n    name::String\nend\n\nStructTypes.StructType(::Type{Spouse}) = StructTypes.Struct()\n\nstruct Person\n    id::Int\n    name::String\n    spouse::Person\nend\n\nStructTypes.StructType(::Type{Person}) = StructTypes.Struct()\nStructTypes.fieldprefix(::Type{Person}, field::Symbol) = field == :spouse ? :spouse_ : :_\n\nHere we have two structs, Spouse and Person, and a Person has a spouse::Spouse. The database tables to represent these entities might look like:\n\nCREATE TABLE spouse (id INT, name VARCHAR);\nCREATE TABLE person (id INT, name VARCHAR, spouse_id INT);\n\nIf we want to leverage a package like Strapping.jl to automatically handle the object construction for us, we could write a get query like the following to ensure a full Person with field spouse::Spouse can be constructed:\n\ngetPerson(id::Int) = Strapping.construct(Person, DBInterface.execute(db,\n    \"\"\"\n        SELECT person.id as id, person.name as name, spouse.id as spouse_id, spouse.name as spouse_name\n        FROM person\n        LEFT JOIN spouse ON person.spouse_id = spouse.id\n        WHERE person.id = $id\n    \"\"\"))\n\nThis works because the column names in the resultset of this query are \"id, name, spouseid, spousename\"; because we defined StructTypes.fieldprefix for Person, Strapping.jl knows that each column starting with \"spouse_\" should be used in constructing the Spouse field of Person.\n\n\n\n\n\n","category":"function"},{"location":"#Interface-Types","page":"Home","title":"Interface Types","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"For interface types, we don't want the internal fields of a type exposed, so an alternative API is to define the closest \"basic\" type that our custom type should map to. This is done by choosing one of the following definitions:","category":"page"},{"location":"","page":"Home","title":"Home","text":"StructTypes.StructType(::Type{MyType}) = StructTypes.DictType()\nStructTypes.StructType(::Type{MyType}) = StructTypes.ArrayType()\nStructTypes.StructType(::Type{MyType}) = StructTypes.StringType()\nStructTypes.StructType(::Type{MyType}) = StructTypes.NumberType()\nStructTypes.StructType(::Type{MyType}) = StructTypes.BoolType()\nStructTypes.StructType(::Type{MyType}) = StructTypes.NullType()","category":"page"},{"location":"","page":"Home","title":"Home","text":"Now we'll walk through each of these and what it means to map my custom Julia type to an interface type.","category":"page"},{"location":"#StructTypes.DictType","page":"Home","title":"StructTypes.DictType","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"StructTypes.DictType","category":"page"},{"location":"#StructTypes.DictType","page":"Home","title":"StructTypes.DictType","text":"StructTypes.StructType(::Type{T}) = StructTypes.DictType()\n\nDeclare that T should map to a dict-like object of unordered key-value pairs, where keys are Symbol, String, or Int64, and values are any other type (or Any).\n\nTypes already declared as StructTypes.DictType() include:\n\nAny subtype of AbstractDict\nAny NamedTuple type\nThe Pair type\n\nSo if your type subtypes AbstractDict and implements its interface, then it will inherit the DictType definition and serializing/deserializing should work automatically.\n\nOtherwise, the interface to satisfy StructTypes.DictType() for deserializing is:\n\nT(x::Dict{Symbol, Any}): implement a constructor that takes a Dict{Symbol, Any} of input key-value pairs\nStructTypes.construct(::Type{T}, x::Dict; kw...): alternatively, you may overload the StructTypes.construct method for your type if defining a constructor is undesirable (or would cause other clashes or ambiguities)\n\nThe interface to satisfy for serializing is:\n\npairs(x): implement the pairs iteration function (from Base) to iterate key-value pairs to be serialized\nStructTypes.keyvaluepairs(x::T): alternatively, you can overload the StructTypes.keyvaluepairs function if overloading pairs isn't possible for whatever reason\n\n\n\n\n\n","category":"type"},{"location":"#StructTypes.ArrayType","page":"Home","title":"StructTypes.ArrayType","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"StructTypes.ArrayType","category":"page"},{"location":"#StructTypes.ArrayType","page":"Home","title":"StructTypes.ArrayType","text":"StructTypes.StructType(::Type{T}) = StructTypes.ArrayType()\n\nDeclare that T should map to an array of ordered elements, homogenous or otherwise.\n\nTypes already declared as StructTypes.ArrayType() include:\n\nAny subtype of AbstractArray\nAny subtype of AbstractSet\nAny Tuple type\n\nSo if your type already subtypes these and satifies their interface, things should just work.\n\nOtherwise, the interface to satisfy StructTypes.ArrayType() for deserializing is:\n\nT(x::Vector): implement a constructor that takes a Vector argument of values and constructs a T\nStructTypes.construct(::Type{T}, x::Vecto; kw...): alternatively, you may overload the StructTypes.construct method for your type if defining a constructor isn't possible\nOptional: Base.IteratorEltype(::Type{T}) = Base.HasEltype() and Base.eltype(x::T): this can be used to signal that elements for your type are expected to be a homogenous type\n\nThe interface to satisfy for serializing is:\n\niterate(x::T): just iteration over each element is required; note if you subtype AbstractArray and define getindex(x::T, i::Int), then iteration is inherited for your type\n\n\n\n\n\n","category":"type"},{"location":"#StructTypes.StringType","page":"Home","title":"StructTypes.StringType","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"StructTypes.StringType","category":"page"},{"location":"#StructTypes.StringType","page":"Home","title":"StructTypes.StringType","text":"StructTypes.StructType(::Type{T}) = StructTypes.StringType()\n\nDeclare that T should map to a string value.\n\nTypes already declared as StructTypes.StringType() include:\n\nAny subtype of AbstractString\nThe Symbol type\nAny subtype of Enum (values are written with their symbolic name)\nAny subtype of AbstractChar\nThe UUID type\nAny Dates.TimeType subtype (Date, DateTime, Time, etc.)\n\nSo if your type is an AbstractString or Enum, then things should already work.\n\nOtherwise, the interface to satisfy StructTypes.StringType() for deserializing is:\n\nT(x::String): define a constructor for your type that takes a single String argument\nStructTypes.construct(::Type{T}, x::String; kw...): alternatively, you may overload StructTypes.construct for your type\nStructTypes.construct(::Type{T}, ptr::Ptr{UInt8}, len::Int; kw...): another option is to overload StructTypes.construct with pointer and length arguments, if it's possible for your custom type to take advantage of avoiding the full string materialization; note that your type should implement both StructTypes.construct methods, since direct pointer/length deserialization may not be possible for some inputs\n\nThe interface to satisfy for serializing is:\n\nBase.string(x::T): overload Base.string for your type to return a \"stringified\" value, or more specifically, that returns an AbstractString, and should implement ncodeunits(x) and codeunit(x, i).\n\n\n\n\n\n","category":"type"},{"location":"#StructTypes.NumberType","page":"Home","title":"StructTypes.NumberType","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"StructTypes.NumberType","category":"page"},{"location":"#StructTypes.NumberType","page":"Home","title":"StructTypes.NumberType","text":"StructTypes.StructType(::Type{T}) = StructTypes.NumberType()\n\nDeclare that T should map to a number value.\n\nTypes already declared as StructTypes.NumberType() include:\n\nAny subtype of Signed\nAny subtype of Unsigned\nAny subtype of AbstractFloat\n\nIn addition to declaring StructTypes.NumberType(), custom types can also specify a specific, existing number type it should map to. It does this like:\n\nStructTypes.numbertype(::Type{T}) = Float64\n\nIn this case, T declares it should map to an already-supported number type: Float64. This means that when deserializing, an input will be parsed/read/deserialiezd as a Float64 value, and then call T(x::Float64). Note that custom types may also overload StructTypes.construct(::Type{T}, x::Float64; kw...) if using a constructor isn't possible. Also note that the default for any type declared as StructTypes.NumberType() is Float64.\n\nSimilarly for serializing, Float64(x::T) will first be called before serializing the resulting Float64 value.\n\n\n\n\n\n","category":"type"},{"location":"#StructTypes.BoolType","page":"Home","title":"StructTypes.BoolType","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"StructTypes.BoolType","category":"page"},{"location":"#StructTypes.BoolType","page":"Home","title":"StructTypes.BoolType","text":"StructTypes.StructType(::Type{T}) = StructTypes.BoolType()\n\nDeclare that T should map to a boolean value.\n\nTypes already declared as StructTypes.BoolType() include:\n\nBool\n\nThe interface to satisfy for deserializing is:\n\nT(x::Bool): define a constructor that takes a single Bool value\nStructTypes.construct(::Type{T}, x::Bool; kw...): alternatively, you may overload StructTypes.construct\n\nThe interface to satisfy for serializing is:\n\nBool(x::T): define a conversion to Bool method\n\n\n\n\n\n","category":"type"},{"location":"#StructTypes.NullType","page":"Home","title":"StructTypes.NullType","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"StructTypes.NullType","category":"page"},{"location":"#StructTypes.NullType","page":"Home","title":"StructTypes.NullType","text":"StructTypes.StructType(::Type{T}) = StructTypes.NullType()\n\nDeclare that T should map to a \"null\" value.\n\nTypes already declared as StructTypes.NullType() include:\n\nnothing\nmissing\n\nThe interface to satisfy for serializing is:\n\nT(): an empty constructor for T\nStructTypes.construct(::Type{T}, x::Nothing; kw...): alternatively, you may overload StructTypes.construct\n\nThere is no interface for serializing; if a custom type is declared as StructTypes.NullType(), then serializing will be handled specially; writing null in JSON, NULL in SQL, etc.\n\n\n\n\n\n","category":"type"},{"location":"#AbstractTypes","page":"Home","title":"AbstractTypes","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"StructTypes.AbstractType","category":"page"},{"location":"#StructTypes.AbstractType","page":"Home","title":"StructTypes.AbstractType","text":"StructTypes.StructType(::Type{T}) = StructTypes.AbstractType()\n\nSignal that T is an abstract type, and when deserializing, one of its concrete subtypes will be materialized, based on a \"type\" key/field in the serialization object.\n\nThus, StructTypes.AbstractTypes must define StructTypes.subtypes, which should be a NamedTuple with subtype keys mapping to concrete Julia subtype values. You may optionally define StructTypes.subtypekey that indicates which input key/field name should be used for identifying the appropriate concrete subtype. A quick example should help illustrate proper use of this StructType:\n\nabstract type Vehicle end\n\nstruct Car <: Vehicle\n    type::String\n    make::String\n    model::String\n    seatingCapacity::Int\n    topSpeed::Float64\nend\n\nstruct Truck <: Vehicle\n    type::String\n    make::String\n    model::String\n    payloadCapacity::Float64\nend\n\nStructTypes.StructType(::Type{Vehicle}) = StructTypes.AbstractType()\nStructTypes.StructType(::Type{Car}) = StructTypes.Struct()\nStructTypes.StructType(::Type{Truck}) = StructTypes.Struct()\nStructTypes.subtypekey(::Type{Vehicle}) = :type\nStructTypes.subtypes(::Type{Vehicle}) = (car=Car, truck=Truck)\n\n# example from StructTypes deserialization\ncar = StructTypes.read(\"\"\"\n{\n    \"type\": \"car\",\n    \"make\": \"Mercedes-Benz\",\n    \"model\": \"S500\",\n    \"seatingCapacity\": 5,\n    \"topSpeed\": 250.1\n}\"\"\", Vehicle)\n\nHere we have a Vehicle type that is defined as a StructTypes.AbstractType(). We also have two concrete subtypes, Car and Truck. In addition to the StructType definition, we also define StructTypes.subtypekey(::Type{Vehicle}) = :type, which signals that when deserializing, when it encounters the type key, it should use the value, in the above example: car, to discover the appropriate concrete subtype to parse the structure as, in this case Car. The mapping of subtype key value to concrete Julia subtype is defined in our example via StructTypes.subtypes(::Type{Vehicle}) = (car=Car, truck=Truck). Thus, StructTypes.AbstractType is useful when the object to deserialize includes a \"subtype\" key-value pair that can be used to parse a specific, concrete type; in our example, parsing the structure as a Car instead of a Truck.\n\n\n\n\n\n","category":"type"},{"location":"#Utilities","page":"Home","title":"Utilities","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Several utility functions are provided for fellow package authors wishing to utilize the StructTypes.StructType trait to integrate in their package. Due to the complexity of correctly handling the various configuration options with StructTypes.Mutable and some of the interface types, it's strongly recommended to rely on these utility functions and open issues for concerns or missing functionality.","category":"page"},{"location":"","page":"Home","title":"Home","text":"StructTypes.constructfrom\nStructTypes.construct\nStructTypes.foreachfield\nStructTypes.mapfields!\nStructTypes.applyfield!","category":"page"},{"location":"#StructTypes.constructfrom","page":"Home","title":"StructTypes.constructfrom","text":"StructTypes.constructfrom(T, obj)\nStructTypes.constructfrom!(x::T, obj)\n\nConstruct an object of type T (StructTypes.construtfrom) or populate an existing object of type T (StructTypes.constructfrom!) from another object obj. Utilizes and respects StructTypes.jl package properties, querying the StructType of T and respecting various serialization/deserialization names, keyword args, etc.\n\nMost typical use-case is construct a custom type T from an obj::AbstractDict, but constructfrom is fully generic, so the inverse is also supported (turning any custom struct into an AbstractDict). For example, an external service may be providing JSON data with an evolving schema; as opposed to trying a strict \"typed parsing\" like JSON3.read(json, T), it may be preferrable to setup a local custom struct with just the desired properties and call StructTypes.constructfrom(T, JSON3.read(json)). This would first do a generic parse of the JSON data into a JSON3.Object, which is an AbstractDict, which is then used as a \"property source\" to populate the fields of our custom type T.\n\n\n\n\n\n","category":"function"},{"location":"#StructTypes.construct","page":"Home","title":"StructTypes.construct","text":"StructTypes.construct(T, args...; kw...)\n\nFunction that custom types can overload for their T to construct an instance, given args... and kw.... The default definition is StructTypes.construct(T, args...; kw...) = T(args...; kw...).\n\n\n\n\n\nStructTypes.construct(f, T) => T\n\nApply function f(i, name, FT) over each field index i, field name name, and field type FT of type T, passing the function results to T for construction, like T(x_1, x_2, ...). Note that any StructTypes.names mappings are applied, as well as field-specific keyword arguments via StructTypes.keywordargs.\n\n\n\n\n\n","category":"function"},{"location":"#StructTypes.foreachfield","page":"Home","title":"StructTypes.foreachfield","text":"StructTypes.foreachfield(f, x::T) => Nothing\n\nApply function f(i, name, FT, v; kw...) over each field index i, field name name, field type FT, field value v, and any kw keyword arguments defined in StructTypes.keywordargs for name in x. Nothing is returned and results from f are ignored. Similar to Base.foreach over collections.\n\nVarious \"configurations\" are respected when applying f to each field:\n\nIf keyword arguments have been defined for a field via StructTypes.keywordargs, they will be passed like f(i, name, FT, v; kw...)\nIf StructTypes.names has been defined, name will be the serialization name instead of the defined julia field name\nIf a field is undefined or empty and StructTypes.omitempties is defined, f won't be applied to that field\nIf a field has been excluded via StructTypes.excludes, it will be skipped\n\n\n\n\n\n","category":"function"},{"location":"#StructTypes.mapfields!","page":"Home","title":"StructTypes.mapfields!","text":"StructTypes.mapfields!(f, x::T)\n\nApplys the function f(i, name, FT; kw...) to each field index i, field name name, field type FT, and any kw defined in StructTypes.keywordargs for name of x, and calls setfield!(x, name, y) where y is returned from f.\n\nThis is a convenience function for working with StructTypes.Mutable, where a function can be applied over the fields of the mutable struct to set each field value. It respects the various StructTypes configurations in terms of skipping/naming/passing keyword arguments as defined.\n\n\n\n\n\n","category":"function"},{"location":"#StructTypes.applyfield!","page":"Home","title":"StructTypes.applyfield!","text":"StructTypes.applyfield!(f, x::T, nm::Symbol) => Bool\n\nConvenience function for working with a StructTypes.Mutable object. For a given serialization name nm, apply the function f(i, name, FT; kw...) to the field index i, field name name, field type FT, and any keyword arguments kw defined in StructTypes.keywordargs, setting the field value to the return value of f. Various StructType configurations are respected like keyword arguments, names, and exclusions. applyfield! returns whether f was executed or not; if nm isn't a valid field name on x, false will be returned (important for applications where the input still needs to consume the field, like json parsing). Note that the input nm is treated as the serialization name, so any StructTypes.names mappings will be applied, and the function will be passed the Julia field name.\n\n\n\n\n\n","category":"function"}]
}
